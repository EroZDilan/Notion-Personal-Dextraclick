using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Configuration;
using NotionClon.Core.DTOs;
using NotionClon.Core.Interfaces;

namespace NotionClon.Infrastructure.Services;

public class ChatService : IChatService
{
    private readonly HttpClient _http;
    private readonly IPaginaService _paginas;
    private readonly IBloqueService _bloques;
    private readonly IConfiguration _config;

    public ChatService(HttpClient http, IPaginaService paginas, IBloqueService bloques, IConfiguration config)
    {
        _http = http;
        _paginas = paginas;
        _bloques = bloques;
        _config = config;
    }

    public async Task<ChatResponseDto> ProcesarAsync(ChatRequestDto request, string usuarioId)
    {
        if (request.ConfirmarAccionPendiente != null)
            return await EjecutarAccionConfirmadaAsync(request.ConfirmarAccionPendiente, usuarioId);

        var arbol = await _paginas.ObtenerArbolAsync(usuarioId);
        var arbolTexto = SerializarArbol(arbol, 0);

        var contextoSection = string.IsNullOrWhiteSpace(request.ContextoConversacion)
            ? ""
            : $"""


            CONTEXTO DE CONVERSACIÓN PREVIA (usa solo si es relevante):
            {request.ContextoConversacion}
            """;

        var systemPrompt = $"""
            Eres el asistente inteligente de NotionClon, una app de notas al estilo Notion.
            Controlas completamente el espacio de notas del usuario.
            Responde siempre en español. Sé conciso y directo.
            Cuando ejecutes acciones, confirma brevemente lo que hiciste.

            ÁRBOL DE PÁGINAS ACTUAL:
            {(string.IsNullOrWhiteSpace(arbolTexto) ? "(sin páginas aún)" : arbolTexto)}{contextoSection}

            Para leer el contenido de una página, usa get_page_content con su ID.
            Para crear bloques, primero obtén el ID de la página con get_page_content.
            """;

        var messages = new JsonArray
        {
            new JsonObject { ["role"] = "system", ["content"] = systemPrompt },
            new JsonObject { ["role"] = "user", ["content"] = request.Mensaje }
        };

        var acciones = new List<AccionEjecutadaDto>();
        var apiUrl = _config["GitHubModels:BaseUrl"] ?? "https://models.inference.ai.azure.com";
        var apiKey = _config["GitHubModels:ApiKey"] ?? "";
        var modelo = _config["GitHubModels:Model"] ?? "gpt-4o-mini";

        for (int i = 0; i < 10; i++)
        {
            var payload = new JsonObject
            {
                ["model"] = modelo,
                ["messages"] = messages.DeepClone(),
                ["tools"] = BuildTools(),
                ["tool_choice"] = "auto"
            };

            var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{apiUrl}/chat/completions");
            httpRequest.Headers.Add("Authorization", $"Bearer {apiKey}");
            httpRequest.Content = new StringContent(payload.ToJsonString(), Encoding.UTF8, "application/json");

            HttpResponseMessage response;
            try { response = await _http.SendAsync(httpRequest); }
            catch (Exception ex) { return Error($"No se pudo conectar con el servicio de IA: {ex.Message}"); }

            var body = await response.Content.ReadAsStringAsync();

            JsonNode? root;
            try { root = JsonNode.Parse(body); }
            catch { return Error("Respuesta inválida del servicio de IA."); }

            if (!response.IsSuccessStatusCode)
            {
                var errMsg = root?["error"]?["message"]?.GetValue<string>() ?? body;
                return Error($"Error del servicio de IA: {errMsg}");
            }

            var message = root?["choices"]?[0]?["message"];
            if (message == null) return Error("Respuesta vacía del servicio de IA.");

            var msgContent = message["content"]?.GetValue<string>() ?? "";
            var finishReason = root?["choices"]?[0]?["finish_reason"]?.GetValue<string>() ?? "";
            var toolCalls = message["tool_calls"]?.AsArray();

            if (finishReason != "tool_calls" || toolCalls == null || toolCalls.Count == 0)
            {
                return new ChatResponseDto
                {
                    Respuesta = msgContent,
                    AccionesEjecutadas = acciones
                };
            }

            // Añadir mensaje del asistente con tool_calls al historial
            var assistantMsg = new JsonObject
            {
                ["role"] = "assistant",
                ["content"] = msgContent
            };
            assistantMsg["tool_calls"] = toolCalls.DeepClone();
            messages.Add(assistantMsg);

            // Procesar cada tool call
            foreach (var tc in toolCalls)
            {
                var toolCallId = tc?["id"]?.GetValue<string>() ?? "";
                var toolName = tc?["function"]?["name"]?.GetValue<string>() ?? "";
                var argsStr = tc?["function"]?["arguments"]?.GetValue<string>() ?? "{}";

                JsonObject args;
                try { args = JsonNode.Parse(argsStr)?.AsObject() ?? new JsonObject(); }
                catch { args = new JsonObject(); }

                // Acciones destructivas: pedir confirmación
                if (toolName is "delete_block" or "archive_page")
                {
                    var (desc, parametros) = DescribirAccionDestructiva(toolName, args);
                    var pregunta = toolName == "delete_block"
                        ? "¿Confirmas que quieres eliminar este bloque?"
                        : $"¿Confirmas que quieres archivar la página \"{parametros.GetValueOrDefault("titulo", "")}\"?";

                    return new ChatResponseDto
                    {
                        Respuesta = pregunta,
                        AccionesEjecutadas = acciones,
                        AccionPendiente = new AccionPendienteDto
                        {
                            Tipo = toolName,
                            Descripcion = desc,
                            Parametros = parametros
                        }
                    };
                }

                var (toolResult, accion) = await EjecutarToolAsync(toolName, args, usuarioId);
                if (accion != null) acciones.Add(accion);

                messages.Add(new JsonObject
                {
                    ["role"] = "tool",
                    ["tool_call_id"] = toolCallId,
                    ["content"] = toolResult
                });
            }
        }

        return Error("No pude completar la solicitud. Intenta de nuevo.");
    }

    private async Task<ChatResponseDto> EjecutarAccionConfirmadaAsync(AccionPendienteDto accion, string usuarioId)
    {
        try
        {
            if (accion.Tipo == "delete_block")
            {
                var id = Guid.Parse(accion.Parametros["bloqueId"]);
                await _bloques.EliminarBloqueAsync(id, usuarioId);
                return new ChatResponseDto
                {
                    Respuesta = "Bloque eliminado.",
                    AccionesEjecutadas = [new AccionEjecutadaDto { Tipo = "delete_block", Descripcion = "Bloque eliminado" }]
                };
            }
            if (accion.Tipo == "archive_page")
            {
                var id = Guid.Parse(accion.Parametros["paginaId"]);
                var pagina = await _paginas.ObtenerConBloquesAsync(id, usuarioId);
                await _paginas.ArchivarAsync(id, usuarioId);
                return new ChatResponseDto
                {
                    Respuesta = $"Página \"{pagina.Titulo}\" archivada.",
                    AccionesEjecutadas = [new AccionEjecutadaDto { Tipo = "archive_page", Descripcion = $"Archivada: {pagina.Titulo}", PaginaId = id.ToString() }]
                };
            }
        }
        catch (Exception ex)
        {
            return Error($"Error al ejecutar la acción: {ex.Message}");
        }
        return Error("Acción no reconocida.");
    }

    private async Task<(string resultado, AccionEjecutadaDto? accion)> EjecutarToolAsync(string toolName, JsonObject args, string usuarioId)
    {
        try
        {
            switch (toolName)
            {
                case "get_page_tree":
                {
                    var arbol = await _paginas.ObtenerArbolAsync(usuarioId);
                    var texto = SerializarArbol(arbol, 0);
                    return (string.IsNullOrWhiteSpace(texto) ? "No hay páginas." : texto, null);
                }

                case "get_page_content":
                {
                    var idStr = args["page_id"]?.GetValue<string>() ?? "";
                    if (!Guid.TryParse(idStr, out var id)) return ("Error: page_id inválido.", null);
                    var pagina = await _paginas.ObtenerConBloquesAsync(id, usuarioId);
                    var bloques = pagina.Bloques.Select(b =>
                        $"[{b.Tipo}] id:{b.Id} orden:{b.Orden} contenido:{JsonSerializer.Serialize(b.Contenido)}");
                    return ($"Página: {pagina.Emoji} {pagina.Titulo}\nBloques:\n{string.Join("\n", bloques)}", null);
                }

                case "search_pages":
                {
                    var q = args["query"]?.GetValue<string>() ?? "";
                    var resultados = await _paginas.BuscarAsync(q, usuarioId);
                    if (!resultados.Any()) return ("Sin resultados.", null);
                    return (string.Join("\n", resultados.Select(r =>
                        $"{r.Emoji} {r.Titulo} (id:{r.PaginaId}){(r.Fragmento != null ? $" — {r.Fragmento}" : "")}")), null);
                }

                case "create_page":
                {
                    var titulo = args["titulo"]?.GetValue<string>() ?? "Sin título";
                    var emoji = args["emoji"]?.GetValue<string>() ?? "📄";
                    var padreIdStr = args["padre_id"]?.GetValue<string>();
                    Guid? padreId = Guid.TryParse(padreIdStr, out var pid) ? pid : null;
                    var nueva = await _paginas.CrearAsync(usuarioId, padreId);
                    await _paginas.ActualizarTituloAsync(nueva.Id, new ActualizarTituloDto { Titulo = titulo, Emoji = emoji }, usuarioId);
                    return ($"Página creada. id:{nueva.Id}", new AccionEjecutadaDto
                    {
                        Tipo = "create_page",
                        Descripcion = $"Página creada: {emoji} {titulo}",
                        PaginaId = nueva.Id.ToString()
                    });
                }

                case "update_page_title":
                {
                    var idStr = args["page_id"]?.GetValue<string>() ?? "";
                    if (!Guid.TryParse(idStr, out var id)) return ("Error: page_id inválido.", null);
                    var titulo = args["titulo"]?.GetValue<string>() ?? "";
                    var emoji = args["emoji"]?.GetValue<string>() ?? "📄";
                    await _paginas.ActualizarTituloAsync(id, new ActualizarTituloDto { Titulo = titulo, Emoji = emoji }, usuarioId);
                    return ($"Título actualizado: {emoji} {titulo}", new AccionEjecutadaDto
                    {
                        Tipo = "update_page_title",
                        Descripcion = $"Título actualizado: {titulo}",
                        PaginaId = id.ToString()
                    });
                }

                case "create_block":
                {
                    var idStr = args["page_id"]?.GetValue<string>() ?? "";
                    if (!Guid.TryParse(idStr, out var pageId)) return ("Error: page_id inválido.", null);
                    var tipo = args["tipo"]?.GetValue<string>() ?? "Parrafo";
                    var orden = args["orden"]?.GetValue<int>() ?? 999;
                    var bloque = await _bloques.CrearBloqueAsync(new CrearBloqueDto
                    {
                        PaginaId = pageId, Tipo = tipo, Orden = orden
                    }, usuarioId);

                    var contenidoStr = args["contenido"]?.ToJsonString();
                    if (!string.IsNullOrEmpty(contenidoStr))
                    {
                        var contenidoObj = JsonSerializer.Deserialize<object>(contenidoStr);
                        if (contenidoObj != null)
                            await _bloques.ActualizarContenidoAsync(bloque.Id, contenidoObj, usuarioId);
                    }

                    return ($"Bloque creado. id:{bloque.Id}", new AccionEjecutadaDto
                    {
                        Tipo = "create_block",
                        Descripcion = $"Bloque {tipo} creado",
                        PaginaId = idStr
                    });
                }

                case "update_block":
                {
                    var idStr = args["block_id"]?.GetValue<string>() ?? "";
                    if (!Guid.TryParse(idStr, out var blockId)) return ("Error: block_id inválido.", null);
                    var contenidoNode = args["contenido"];
                    if (contenidoNode == null) return ("Error: contenido requerido.", null);
                    var contenidoObj = JsonSerializer.Deserialize<object>(contenidoNode.ToJsonString())!;
                    await _bloques.ActualizarContenidoAsync(blockId, contenidoObj, usuarioId);
                    return ("Bloque actualizado.", new AccionEjecutadaDto
                    {
                        Tipo = "update_block", Descripcion = "Contenido de bloque actualizado"
                    });
                }

                default:
                    return ($"Tool desconocida: {toolName}", null);
            }
        }
        catch (Exception ex)
        {
            return ($"Error en {toolName}: {ex.Message}", null);
        }
    }

    private static (string descripcion, Dictionary<string, string> parametros) DescribirAccionDestructiva(string tipo, JsonObject args)
    {
        if (tipo == "delete_block")
        {
            var id = args["block_id"]?.GetValue<string>() ?? "";
            return ("Eliminar bloque", new Dictionary<string, string> { ["bloqueId"] = id });
        }
        var pId = args["page_id"]?.GetValue<string>() ?? "";
        var titulo = args["titulo"]?.GetValue<string>() ?? "";
        return ($"Archivar página: {titulo}", new Dictionary<string, string> { ["paginaId"] = pId, ["titulo"] = titulo });
    }

    private static string SerializarArbol(List<PaginaDto> paginas, int nivel)
    {
        var sb = new StringBuilder();
        foreach (var p in paginas)
        {
            sb.AppendLine($"{new string(' ', nivel * 2)}{p.Emoji} {p.Titulo} (id:{p.Id})");
            if (p.SubPaginas.Any())
                sb.Append(SerializarArbol(p.SubPaginas, nivel + 1));
        }
        return sb.ToString();
    }

    private static ChatResponseDto Error(string msg) => new() { Respuesta = msg };

    private static JsonArray BuildTools() => new()
    {
        Tool("get_page_tree", "Obtiene el árbol completo de páginas del usuario.", new JsonObject()),
        Tool("get_page_content", "Obtiene el contenido de una página con todos sus bloques.", new JsonObject
        {
            ["page_id"] = Prop("string", "ID de la página (GUID)")
        }, ["page_id"]),
        Tool("search_pages", "Busca páginas y bloques por texto.", new JsonObject
        {
            ["query"] = Prop("string", "Texto a buscar")
        }, ["query"]),
        Tool("create_page", "Crea una nueva página.", new JsonObject
        {
            ["titulo"] = Prop("string", "Título"),
            ["emoji"] = Prop("string", "Emoji (ej: 📝)"),
            ["padre_id"] = Prop("string", "ID página padre (opcional)")
        }, ["titulo"]),
        Tool("update_page_title", "Actualiza el título y emoji de una página.", new JsonObject
        {
            ["page_id"] = Prop("string", "ID de la página"),
            ["titulo"] = Prop("string", "Nuevo título"),
            ["emoji"] = Prop("string", "Nuevo emoji")
        }, ["page_id", "titulo"]),
        Tool("create_block", "Crea un bloque en una página. Tipos: Parrafo, Heading1, Heading2, Heading3, ListaBullets, ListaNumerada, Codigo, Imagen, Divisor, Llamada, Cita.", new JsonObject
        {
            ["page_id"] = Prop("string", "ID de la página"),
            ["tipo"] = Prop("string", "Tipo de bloque"),
            ["orden"] = Prop("integer", "Posición (0=primero)"),
            ["contenido"] = Prop("object", "Contenido: {\"texto\":\"...\"} para texto, {\"lenguaje\":\"js\",\"codigo\":\"...\"} para código")
        }, ["page_id", "tipo"]),
        Tool("update_block", "Actualiza el contenido de un bloque.", new JsonObject
        {
            ["block_id"] = Prop("string", "ID del bloque"),
            ["contenido"] = Prop("object", "Nuevo contenido")
        }, ["block_id", "contenido"]),
        Tool("delete_block", "Elimina un bloque. Requiere confirmación del usuario.", new JsonObject
        {
            ["block_id"] = Prop("string", "ID del bloque")
        }, ["block_id"]),
        Tool("archive_page", "Archiva una página (papelera). Requiere confirmación del usuario.", new JsonObject
        {
            ["page_id"] = Prop("string", "ID de la página"),
            ["titulo"] = Prop("string", "Título de la página")
        }, ["page_id"])
    };

    private static JsonObject Tool(string name, string desc, JsonObject props, string[]? required = null)
    {
        var parameters = new JsonObject { ["type"] = "object", ["properties"] = props };
        if (required?.Length > 0)
        {
            var arr = new JsonArray();
            foreach (var r in required) arr.Add(r);
            parameters["required"] = arr;
        }
        return new JsonObject
        {
            ["type"] = "function",
            ["function"] = new JsonObject { ["name"] = name, ["description"] = desc, ["parameters"] = parameters }
        };
    }

    private static JsonObject Prop(string type, string desc) =>
        new JsonObject { ["type"] = type, ["description"] = desc };
}

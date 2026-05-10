static class ApiResponses
{
    public static IResult Validation(string detail) =>
        Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: "Validation failed", detail: detail);

    public static IResult Conflict(string detail) =>
        Results.Problem(statusCode: StatusCodes.Status409Conflict, title: "Conflict", detail: detail);

    public static IResult Unauthorized(string detail) =>
        Results.Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Unauthorized", detail: detail);
}

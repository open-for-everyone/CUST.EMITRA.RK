static class CorrelationIdSanitizer
{
    public static string Normalize(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return Guid.NewGuid().ToString("N");
        }

        var source = input.Trim();
        Span<char> buffer = stackalloc char[Math.Min(source.Length, 64)];
        var index = 0;

        foreach (var ch in source)
        {
            if (index >= buffer.Length)
            {
                break;
            }

            if (char.IsLetterOrDigit(ch) || ch is '-' or '_')
            {
                buffer[index++] = ch;
            }
        }

        return index == 0
            ? Guid.NewGuid().ToString("N")
            : new string(buffer[..index]);
    }
}

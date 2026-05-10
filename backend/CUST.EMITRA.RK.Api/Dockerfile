FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY CUST.EMITRA.RK.Api.csproj ./
RUN dotnet restore CUST.EMITRA.RK.Api.csproj

COPY . ./
RUN dotnet publish CUST.EMITRA.RK.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish ./

ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

CMD ["sh", "-c", "ASPNETCORE_URLS=http://+:${PORT:-10000} dotnet CUST.EMITRA.RK.Api.dll"]

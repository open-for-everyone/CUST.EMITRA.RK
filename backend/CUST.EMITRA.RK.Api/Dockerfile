FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY . ./
RUN if [ -f CUST.EMITRA.RK.Api.csproj ]; then \
      dotnet restore CUST.EMITRA.RK.Api.csproj; \
    else \
      dotnet restore backend/CUST.EMITRA.RK.Api/CUST.EMITRA.RK.Api.csproj; \
    fi

RUN if [ -f CUST.EMITRA.RK.Api.csproj ]; then \
      dotnet publish CUST.EMITRA.RK.Api.csproj -c Release -o /app/publish /p:UseAppHost=false; \
    else \
      dotnet publish backend/CUST.EMITRA.RK.Api/CUST.EMITRA.RK.Api.csproj -c Release -o /app/publish /p:UseAppHost=false; \
    fi

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish ./

EXPOSE 10000

CMD ["sh", "-c", "ASPNETCORE_URLS=http://+:${PORT:-10000} dotnet CUST.EMITRA.RK.Api.dll"]

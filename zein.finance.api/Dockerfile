#Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /

COPY ["zein.finance.api.csproj", "zein.finance.api/"]
RUN dotnet restore "zein.finance.api/zein.finance.api.csproj"

COPY ["/", "zein.finance.api/"]
RUN dotnet publish "zein.finance.api/zein.finance.api.csproj" -c Release -o /zein.finance.api/publish

#Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /zein.finance.api

EXPOSE 8080
COPY --from=build /zein.finance.api/publish .

ENTRYPOINT ["dotnet", "zein.finance.api.dll"]
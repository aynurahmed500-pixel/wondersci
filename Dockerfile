# Етап 1: Компилиране на приложението
FROM ://microsoft.com AS build
WORKDIR /src
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

# Етап 2: Стартиране в лек изолиран контейнер
FROM ://microsoft.com
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "wondersci.dll"]

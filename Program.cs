var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "Здравей! Моят C# сайт работи!");

app.Run();

using MySqlConnector;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/products", async () =>
{
    var connectionString = "Server=dhnwv-95-43-172-234.run.pinggy-free.link;Port=44897;Database=wondersci;User=root;Password=1234;";
    
    using var connection = new MySqlConnection(connectionString);
    await connection.OpenAsync();

    using var command = new MySqlCommand("SELECT id, name, description, price, image, category, stock FROM products;", connection);
    using var reader = await command.ExecuteReaderAsync();

    var list = new List<object>();
    while (await reader.ReadAsync())
    {
        list.Add(new { 
            id = reader.GetInt32(0),
            name = reader.GetString(1), 
            description = reader.IsDBNull(2) ? "" : reader.GetString(2),
            price = reader.GetDecimal(3),
            image = reader.IsDBNull(4) ? "" : reader.GetString(4),
            category = reader.IsDBNull(5) ? "" : reader.GetString(5),
            stock = reader.IsDBNull(6) ? 0 : reader.GetInt32(6)
        });
    }

    return list;
});

app.Run();

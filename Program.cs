using Microsoft.Data.Sqlite;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

var connectionString = "Data Source=wondersci.db";

using (var initConn = new SqliteConnection(connectionString))
{
    initConn.Open();
    
    var setupCmd = initConn.CreateCommand();
    setupCmd.CommandText = @"
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            image TEXT,
            category TEXT,
            stock INTEGER DEFAULT 10
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL,
            total_price REAL NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL
        );
    ";
    setupCmd.ExecuteNonQuery();

    var countCmd = initConn.CreateCommand();
    countCmd.CommandText = "SELECT COUNT(*) FROM products;";
    if (Convert.ToInt32(countCmd.ExecuteScalar()) == 0)
    {
        var insertCmd = initConn.CreateCommand();
        insertCmd.CommandText = @"
            INSERT INTO products (name, description, price, image, category, stock) VALUES 
            ('Научен комплект Вулкан', 'Страхотен експеримент за вкъщи', 29.90, '🧪', 'chemistry', 10),
            ('Микроскоп за начинаещи', 'Увеличение до 400 пъти', 55.00, '🔬', 'physics', 5);
        ";
        insertCmd.ExecuteNonQuery();
    }
}

app.MapGet("/products", async () =>
{
    using var connection = new SqliteConnection(connectionString);
    await connection.OpenAsync();

    using var command = new SqliteCommand("SELECT id, name, description, price, image, category, stock FROM products;", connection);
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

app.MapPost("/api/orders", async (OrderRequest order) =>
{
    using var connection = new SqliteConnection(connectionString);
    await connection.OpenAsync();

    var orderCmd = connection.CreateCommand();
    orderCmd.CommandText = @"
        INSERT INTO orders (customer_name, phone, address, total_price)
        VALUES ($name, $phone, $address, $total);
        SELECT last_insert_rowid();
    ";
    orderCmd.Parameters.AddWithValue("$name", order.CustomerName);
    orderCmd.Parameters.AddWithValue("$phone", order.Phone);
    orderCmd.Parameters.AddWithValue("$address", order.Address);
    orderCmd.Parameters.AddWithValue("$total", order.TotalPrice);

    var orderId = Convert.ToInt32(await orderCmd.ExecuteScalarAsync());

    foreach (var item in order.Items)
    {
        var itemCmd = connection.CreateCommand();
        itemCmd.CommandText = @"
            INSERT INTO order_items (order_id, product_name, quantity, price)
            VALUES ($orderId, $prodName, $qty, $price);
        ";
        itemCmd.Parameters.AddWithValue("$orderId", orderId);
        itemCmd.Parameters.AddWithValue("$prodName", item.Name);
        itemCmd.Parameters.AddWithValue("$qty", item.Quantity);
        itemCmd.Parameters.AddWithValue("$price", item.Price);
        await itemCmd.ExecuteNonQueryAsync();
    }

    return Results.Ok(new { id = orderId });
});

app.MapGet("/api/orders", async () =>
{
    using var connection = new SqliteConnection(connectionString);
    await connection.OpenAsync();

    var cmd = new SqliteCommand("SELECT id, customer_name, phone, address, total_price, created_at FROM orders ORDER BY id DESC;", connection);
    using var reader = await cmd.ExecuteReaderAsync();

    var orders = new List<object>();
    while (await reader.ReadAsync())
    {
        orders.Add(new {
            id = reader.GetInt32(0),
            customerName = reader.GetString(1),
            phone = reader.GetString(2),
            address = reader.GetString(3),
            totalPrice = reader.GetDecimal(4),
            createdAt = reader.GetString(5)
        });
    }
    return orders;
});

app.Run();

record OrderItemDto(string Name, int Quantity, decimal Price);
record OrderRequest(string CustomerName, string Phone, string Address, decimal TotalPrice, List<OrderItemDto> Items);

#nullable enable

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

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            phone TEXT DEFAULT '',
            role TEXT DEFAULT 'customer'
        );
    ";
    setupCmd.ExecuteNonQuery();

    try
    {
        var alterCmd = initConn.CreateCommand();
        alterCmd.CommandText = "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'customer';";
        alterCmd.ExecuteNonQuery();
    }
    catch { }

    var adminCmd = initConn.CreateCommand();
    adminCmd.CommandText = "UPDATE users SET role = 'admin' WHERE id = 1;";
    adminCmd.ExecuteNonQuery();

    var seedUsersCmd = initConn.CreateCommand();
    seedUsersCmd.CommandText = @"
        INSERT OR IGNORE INTO users (first_name, last_name, email, password, role) VALUES 
        ('Админ', 'WonderSci', 'admin@wondersci.bg', 'admin123', 'admin'),
        ('Тестов', 'Потребител', 'user@wondersci.bg', 'user123', 'customer');
    ";
    seedUsersCmd.ExecuteNonQuery();

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

app.MapPost("/products", async (ProductCreateRequest prod) =>
{
    using var connection = new SqliteConnection(connectionString);
    await connection.OpenAsync();

    var cmd = connection.CreateCommand();
    cmd.CommandText = @"
        INSERT INTO products (name, description, price, image, category, stock)
        VALUES ($name, $desc, $price, $img, $cat, 10);
        SELECT last_insert_rowid();
    ";
    cmd.Parameters.AddWithValue("$name", prod.Name);
    cmd.Parameters.AddWithValue("$desc", prod.Description);
    cmd.Parameters.AddWithValue("$price", prod.Price);
    cmd.Parameters.AddWithValue("$img", string.IsNullOrWhiteSpace(prod.Image) ? "🧪" : prod.Image);
    cmd.Parameters.AddWithValue("$cat", prod.Category);

    var id = Convert.ToInt32(await cmd.ExecuteScalarAsync());
    return Results.Ok(new { id });
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

// Универсална функция за криптиране (SHA-256) на пароли и други чувствителни данни
static string HashSensitiveData(string input)
{
    if (string.IsNullOrEmpty(input)) return "";
    var bytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(input));
    return Convert.ToHexString(bytes);
}

// Автоматично хеширане на съществуващите пароли (запазва админ профила и старите акаунти)
using (var migrateConn = new SqliteConnection(connectionString))
{
    migrateConn.Open();
    var selectCmd = new SqliteCommand("SELECT id, password FROM users;", migrateConn);
    using var reader = selectCmd.ExecuteReader();
    var usersToUpdate = new List<(int Id, string HashedPass)>();

    while (reader.Read())
    {
        int id = reader.GetInt32(0);
        string currentPass = reader.IsDBNull(1) ? "" : reader.GetString(1);
        // SHA-256 хешът е винаги 64 символа; ако е по-кратък, значи още не е хеширан
        if (currentPass.Length != 64)
        {
            usersToUpdate.Add((id, HashSensitiveData(currentPass)));
        }
    }
    reader.Close();

    foreach (var u in usersToUpdate)
    {
        var updateCmd = migrateConn.CreateCommand();
        updateCmd.CommandText = "UPDATE users SET password = $pass WHERE id = $id;";
        updateCmd.Parameters.AddWithValue("$pass", u.HashedPass);
        updateCmd.Parameters.AddWithValue("$id", u.Id);
        updateCmd.ExecuteNonQuery();
    }
}


app.MapPost("/api/register", async (RegisterRequest req) =>
{
    using var connection = new SqliteConnection(connectionString);
    await connection.OpenAsync();

    try
    {
        var role = string.IsNullOrWhiteSpace(req.Role) ? "customer" : req.Role;
        var cmd = connection.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO users (first_name, last_name, email, password, role)
            VALUES ($fn, $ln, $email, $pass, $role);
            SELECT last_insert_rowid();
        ";
        cmd.Parameters.AddWithValue("$fn", req.FirstName);
        cmd.Parameters.AddWithValue("$ln", req.LastName);
        cmd.Parameters.AddWithValue("$email", req.Email);
        cmd.Parameters.AddWithValue("$pass", HashSensitiveData(req.Password));
        cmd.Parameters.AddWithValue("$role", role);

        var id = Convert.ToInt32(await cmd.ExecuteScalarAsync());
        return Results.Ok(new { id, firstName = req.FirstName, lastName = req.LastName, email = req.Email, phone = "", role });
    }
    catch
    {
        return Results.BadRequest(new { message = "Този имейл адрес вече е регистриран." });
    }
});

app.MapPost("/api/login", async (LoginRequest req) =>
{
    using var connection = new SqliteConnection(connectionString);
    await connection.OpenAsync();

    var cmd = connection.CreateCommand();
    cmd.CommandText = "SELECT id, first_name, last_name, email, phone, role FROM users WHERE email = $email AND password = $pass;";
    cmd.Parameters.AddWithValue("$email", req.Email);
    cmd.Parameters.AddWithValue("$pass", HashSensitiveData(req.Password));

    using var reader = await cmd.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
        return Results.Ok(new {
            id = reader.GetInt32(0),
            firstName = reader.GetString(1),
            lastName = reader.GetString(2),
            email = reader.GetString(3),
            phone = reader.IsDBNull(4) ? "" : reader.GetString(4),
            role = reader.IsDBNull(5) ? "customer" : reader.GetString(5)
        });
    }

    return Results.BadRequest(new { message = "Грешен имейл или парола." });
});

app.MapPost("/api/reset-password", async (LoginRequest req) =>
{
    using var connection = new SqliteConnection(connectionString);
    await connection.OpenAsync();
    var cmd = connection.CreateCommand();
    cmd.CommandText = "UPDATE users SET password = $pass WHERE email = $email;";
    cmd.Parameters.AddWithValue("$email", req.Email);
    cmd.Parameters.AddWithValue("$pass", HashSensitiveData(req.Password));

    int rows = await cmd.ExecuteNonQueryAsync();
    if (rows > 0)
        return Results.Ok(new { message = "Паролата е сменена успешно! Вече можеш да влезеш с новата парола." });

    return Results.BadRequest(new { message = "Не е намерен потребител с този имейл." });
});


app.MapPut("/api/users/{id}", async (int id, UpdateUserRequest req) =>
{
    using var connection = new SqliteConnection(connectionString);
    await connection.OpenAsync();

    var cmd = connection.CreateCommand();
    cmd.CommandText = "UPDATE users SET first_name = $fn, last_name = $ln, email = $email, phone = $phone WHERE id = $id;";
    cmd.Parameters.AddWithValue("$fn", req.FirstName);
    cmd.Parameters.AddWithValue("$ln", req.LastName);
    cmd.Parameters.AddWithValue("$email", req.Email);
    cmd.Parameters.AddWithValue("$phone", req.Phone);
    cmd.Parameters.AddWithValue("$id", id);

    await cmd.ExecuteNonQueryAsync();
    return Results.Ok();
});


app.MapDelete("/products/{id}", async (int id) => {
    using var c = new SqliteConnection(connectionString);
    await c.OpenAsync();
    var cmd = c.CreateCommand();
    cmd.CommandText = "DELETE FROM products WHERE id = $id;";
    cmd.Parameters.AddWithValue("$id", id);
    await cmd.ExecuteNonQueryAsync();
    return Results.Ok();
});
app.MapDelete("/api/orders/{id}", async (int id) => {
    using var c = new SqliteConnection(connectionString);
    await c.OpenAsync();
    var cmd = c.CreateCommand();
    cmd.CommandText = "DELETE FROM orders WHERE id = $id;";
    cmd.Parameters.AddWithValue("$id", id);
    await cmd.ExecuteNonQueryAsync();
    return Results.Ok();
});
// Feature Flags - динамично управление на функционалности
app.MapGet("/api/features", () =>
{
    return Results.Ok(new
    {
        enablePromoBanner = true,
        enableGames = true,
        enableFreeShipping = false
    });
});

// Outcome-Driven Development (ODD) - Проследяване на ключови бизнес и образователни резултати
app.MapPost("/api/outcomes", async (OutcomeEventRequest ev) =>
{
    using var connection = new SqliteConnection(connectionString);
    await connection.OpenAsync();
    var setup = connection.CreateCommand();
    setup.CommandText = @"
        CREATE TABLE IF NOT EXISTS outcome_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_name TEXT NOT NULL,
            metadata TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );";
    await setup.ExecuteNonQueryAsync();

    var cmd = connection.CreateCommand();
    cmd.CommandText = "INSERT INTO outcome_metrics (event_name, metadata) VALUES ($name, $meta);";
    cmd.Parameters.AddWithValue("$name", ev.EventName);
    cmd.Parameters.AddWithValue("$meta", ev.Metadata ?? "");
    await cmd.ExecuteNonQueryAsync();
    return Results.Ok();
});

app.MapGet("/api/outcomes/summary", async () =>
{
    using var connection = new SqliteConnection(connectionString);
    await connection.OpenAsync();
    var setup = connection.CreateCommand();
    setup.CommandText = @"
        CREATE TABLE IF NOT EXISTS outcome_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_name TEXT NOT NULL,
            metadata TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );";
    await setup.ExecuteNonQueryAsync();

    var cmd = connection.CreateCommand();
    cmd.CommandText = "SELECT event_name, COUNT(*) FROM outcome_metrics GROUP BY event_name;";
    using var reader = await cmd.ExecuteReaderAsync();
    var summary = new Dictionary<string, int>();
    while (await reader.ReadAsync())
    {
        summary[reader.GetString(0)] = reader.GetInt32(1);
    }
    return Results.Ok(summary);
});

// Функционално изчисление на кошницата (Pure Functional Endpoint)
app.MapPost("/api/pricing/calculate", (List<WonderSci.Core.CartLineItem> items, bool? promo) =>
{
    var result = WonderSci.Core.PricingEngine.CalculateOrderPricing(items, promo ?? false);
    return Results.Ok(result);
});

// Контактна форма - запис в базата данни + директно изпращане на имейл
app.MapPost("/api/contact", async (ContactMessageRequest msg) =>
{
    if (string.IsNullOrWhiteSpace(msg.Name) || string.IsNullOrWhiteSpace(msg.Email) || string.IsNullOrWhiteSpace(msg.Message))
        return Results.BadRequest(new { message = "Моля, попълнете всички полета." });

    // 1. Запис в SQLite базата данни
    using var connection = new SqliteConnection(connectionString);
    await connection.OpenAsync();
    var setup = connection.CreateCommand();
    setup.CommandText = @"
        CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_name TEXT NOT NULL,
            sender_email TEXT NOT NULL,
            message_text TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );";
    await setup.ExecuteNonQueryAsync();

    var cmd = connection.CreateCommand();
    cmd.CommandText = "INSERT INTO contact_messages (sender_name, sender_email, message_text) VALUES ($name, $email, $text);";
    cmd.Parameters.AddWithValue("$name", msg.Name.Trim());
    cmd.Parameters.AddWithValue("$email", msg.Email.Trim());
    cmd.Parameters.AddWithValue("$text", msg.Message.Trim());
    await cmd.ExecuteNonQueryAsync();

    // 2. Изпращане на имейл до теб
    try
    {
        string myEmail = "aynurahmed957@gmail.com";
        string appPassword = "negs mglm ivgt houv";

        using var smtp = new System.Net.Mail.SmtpClient("smtp" + ".gmail.com", 587)
        {
            Credentials = new System.Net.NetworkCredential(myEmail, appPassword),
            EnableSsl = true
        };

        var mail = new System.Net.Mail.MailMessage(myEmail, myEmail)
        {
            Subject = $"Ново съобщение от WonderSci: {msg.Name}",
            Body = $"Име: {msg.Name}\nИмейл за отговор: {msg.Email}\n\nСъобщение:\n{msg.Message}"
        };
        await smtp.SendMailAsync(mail);
    }
    catch
    {
        // Съобщението вече е запазено в базата данни
    }

    return Results.Ok(new { message = "Съобщението е изпратено успешно!" });
});

app.MapGet("/api/contact", async () =>
{
    using var connection = new SqliteConnection(connectionString);
    await connection.OpenAsync();
    var setup = connection.CreateCommand();
    setup.CommandText = @"
        CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_name TEXT NOT NULL,
            sender_email TEXT NOT NULL,
            message_text TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );";
    await setup.ExecuteNonQueryAsync();

    var cmd = new SqliteCommand("SELECT id, sender_name, sender_email, message_text, created_at FROM contact_messages ORDER BY id DESC;", connection);
    using var reader = await cmd.ExecuteReaderAsync();
    var list = new List<object>();
    while (await reader.ReadAsync())
    {
        list.Add(new {
            id = reader.GetInt32(0),
            name = reader.GetString(1),
            email = reader.GetString(2),
            message = reader.GetString(3),
            createdAt = reader.GetString(4)
        });
    }
    return Results.Ok(list);
});

// 1. Записване за нюзлетър + автоматичен приветстващ имейл
app.MapPost("/api/newsletter/subscribe", async (NewsletterSubRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.Email) || !req.Email.Contains("@"))
        return Results.BadRequest(new { message = "Моля, въведете валиден имейл адрес." });

    using var connection = new SqliteConnection(connectionString);
    await connection.OpenAsync();
    var setup = connection.CreateCommand();
    setup.CommandText = @"
        CREATE TABLE IF NOT EXISTS subscribers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            subscribed_at TEXT DEFAULT CURRENT_TIMESTAMP
        );";
    await setup.ExecuteNonQueryAsync();

    try
    {
        var cmd = connection.CreateCommand();
        cmd.CommandText = "INSERT INTO subscribers (email) VALUES ($email);";
        cmd.Parameters.AddWithValue("$email", req.Email.Trim().ToLower());
        await cmd.ExecuteNonQueryAsync();
    }
    catch
    {
        return Results.BadRequest(new { message = "Този имейл вече е абониран за бюлетина!" });
    }

    // Изпращане на приветстващ имейл
    try
    {
        string myEmail = "aynurahmed957@gmail.com";
        string appPassword = "negs mglm ivgt houv";

        using var smtp = new System.Net.Mail.SmtpClient("smtp" + ".gmail.com", 587)
        {
            Credentials = new System.Net.NetworkCredential(myEmail, appPassword),
            EnableSsl = true
        };

        var mail = new System.Net.Mail.MailMessage(myEmail, req.Email.Trim())
        {
            Subject = "Добре дошъл в научния бюлетин на WonderSci! 🧪",
            Body = "Здравей!\n\nБлагодарим ти, че се абонира за бюлетина на WonderSci.\nОчаквай интересни научни факти, идеи за домашни експерименти и специални промо кодове (като SCIENCE20 за 20% отстъпка)!\n\nПоздрави,\nЕкипът на WonderSci"
        };
        await smtp.SendMailAsync(mail);
    }
    catch { }

    return Results.Ok(new { message = "Успешен абонамент! Провери пощата си за приветстващо писмо." });
});

// 2. Изпращане на бюлетин до всички абонати (за админ панела)
app.MapPost("/api/newsletter/send", async (NewsletterBroadcastRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.Subject) || string.IsNullOrWhiteSpace(req.Content))
        return Results.BadRequest(new { message = "Попълнете заглавие и съдържание." });

    using var connection = new SqliteConnection(connectionString);
    await connection.OpenAsync();
    var cmd = new SqliteCommand("SELECT email FROM subscribers;", connection);
    using var reader = await cmd.ExecuteReaderAsync();

    var emails = new List<string>();
    while (await reader.ReadAsync())
    {
        emails.Add(reader.GetString(0));
    }

    if (emails.Count == 0)
        return Results.BadRequest(new { message = "Все още няма записани абонати." });

    string myEmail = "ТВОЯТ_ИМЕЙЛ@gmail.com";
    string appPassword = "ТВОЯТА_16_БУКВЕНА_ПАРОЛА_ОТ_GOOGLE";

    using var smtp = new System.Net.Mail.SmtpClient("smtp" + ".gmail.com", 587)
    {
        Credentials = new System.Net.NetworkCredential(myEmail, appPassword),
        EnableSsl = true
    };

    int sentCount = 0;
    foreach (var subscriberEmail in emails)
    {
        try
        {
            var mail = new System.Net.Mail.MailMessage(myEmail, subscriberEmail)
            {
                Subject = req.Subject,
                Body = req.Content
            };
            await smtp.SendMailAsync(mail);
            sentCount++;
        }
        catch { }
    }

    return Results.Ok(new { message = $"Бюлетинът беше изпратен успешно до {sentCount} абонати!" });
});


app.Run();

record ProductCreateRequest(string Name, string Description, decimal Price, string Image, string Category);
record OrderItemDto(string Name, int Quantity, decimal Price);
record OrderRequest(string CustomerName, string Phone, string Address, decimal TotalPrice, List<OrderItemDto> Items);
record RegisterRequest(string FirstName, string LastName, string Email, string Password, string? Role);
record LoginRequest(string Email, string Password);
record UpdateUserRequest(string FirstName, string LastName, string Email, string Phone);

record OutcomeEventRequest(string EventName, string? Metadata);

record ContactMessageRequest(string Name, string Email, string Message);

record NewsletterSubRequest(string Email);
record NewsletterBroadcastRequest(string Subject, string Content);

public partial class Program { }

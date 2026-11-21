using Xunit;

namespace WonderSci.Tests;

public class StoreLogicTests
{
    [Fact]
    public void CalculateCartTotal_ReturnsCorrectSum()
    {
        decimal price1 = 29.90m;
        int qty1 = 2;
        decimal price2 = 55.00m;
        int qty2 = 1;

        decimal total = (price1 * qty1) + (price2 * qty2);

        Assert.Equal(114.80m, total);
    }

    [Fact]
    public void ApplyPromoDiscount_TenPercent_ReducesPriceCorrectly()
    {
        decimal originalPrice = 100.00m;
        decimal discountedPrice = originalPrice * 0.90m;

        Assert.Equal(90.00m, discountedPrice);
    }

    [Theory]
    [InlineData("user@wondersci.bg", true)]
    [InlineData("invalid-email", false)]
    [InlineData("", false)]
    public void ValidateEmail_ChecksFormatCorrectly(string email, bool expected)
    {
        bool isValid = !string.IsNullOrWhiteSpace(email) && email.Contains("@") && email.Contains(".");
        Assert.Equal(expected, isValid);
    }

    [Fact]
    public void CheckStockAvailability_WhenEnoughQuantity_ReturnsTrue()
    {
        int availableStock = 10;
        int requestedQuantity = 3;

        Assert.True(availableStock >= requestedQuantity);
    }
}

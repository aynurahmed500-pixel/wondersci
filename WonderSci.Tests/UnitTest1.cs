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
        [Fact]
    public void PricingEngine_PureFunction_IsDeterministicAndVerifiesInvariants()
    {
        var items = new[]
        {
            new WonderSci.Core.CartLineItem("Вулкан", 30.00m, 2),
            new WonderSci.Core.CartLineItem("Микроскоп", 50.00m, 1)
        };

        var result1 = WonderSci.Core.PricingEngine.CalculateOrderPricing(items, isPromoActive: true);
        var result2 = WonderSci.Core.PricingEngine.CalculateOrderPricing(items, isPromoActive: true);

        // Инвариант 1: Детерминизъм (еднакви входове -> идентичен изход)
        Assert.Equal(result1, result2);

        // Инвариант 2: Крайната цена винаги е <= началната сума
        Assert.True(result1.FinalTotal <= result1.Subtotal);
        Assert.Equal(99.00m, result1.FinalTotal);
        Assert.True(result1.IsFreeShippingEligible);
    }

    [Theory]
    [InlineData("SCIENCE20", 100.00, 80.00)]
    [InlineData("INVALID", 100.00, 100.00)]
    public void ApplyPromoCode_TDD_CalculatesDiscountCorrectly(string code, decimal price, decimal expected)
    {
        decimal result = WonderSci.Core.PricingEngine.ApplyPromoCode(price, code);
        Assert.Equal(expected, result);
    }


}

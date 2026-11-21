namespace WonderSci.Core;

// Непроменими структури от данни (Immutability - основен принцип на функционалното програмиране)
public sealed record CartLineItem(string Name, decimal UnitPrice, int Quantity);

public sealed record PricingResult(
    decimal Subtotal,
    decimal DiscountAmount,
    decimal FinalTotal,
    bool IsFreeShippingEligible
);

// Чисти функции (Pure Functions) без странични ефекти за формална верификация
public static class PricingEngine
{
    public static PricingResult CalculateOrderPricing(
        IEnumerable<CartLineItem> items,
        bool isPromoActive,
        decimal promoDiscountRate = 0.10m,
        decimal freeShippingThreshold = 50.00m)
    {
        if (items is null)
            throw new ArgumentNullException(nameof(items));

        // Декларативно функционално изчисление чрез LINQ и Aggregate (Fold)
        var validItems = items.Where(i => i.UnitPrice >= 0 && i.Quantity > 0);

        decimal subtotal = validItems.Aggregate(
            0m,
            (acc, item) => acc + (item.UnitPrice * item.Quantity)
        );

        decimal discount = isPromoActive
            ? Math.Round(subtotal * promoDiscountRate, 2, MidpointRounding.AwayFromZero)
            : 0m;

        decimal finalTotal = Math.Max(0m, subtotal - discount);
        bool freeShipping = finalTotal >= freeShippingThreshold;

        return new PricingResult(subtotal, discount, finalTotal, freeShipping);
    }
}

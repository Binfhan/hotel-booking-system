package com.hotel.booking.patterns.structural.decorator;

import com.hotel.booking.entity.BookingServiceItem;
import com.hotel.booking.entity.Room;
import com.hotel.booking.enums.AddonServiceType;
import com.hotel.booking.patterns.creational.builder.BookingOrder;
import lombok.Getter;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class BookingCostBuilderService {

    @Getter
    public static class DecoratedCostResult {
        private final BigDecimal baseRoomCost;
        private final BigDecimal addonServicesCost;
        private final BigDecimal subTotal;
        private final String description;
        private final List<BookingServiceItem> serviceItems;

        public DecoratedCostResult(
                BigDecimal baseRoomCost,
                BigDecimal addonServicesCost,
                BigDecimal subTotal,
                String description,
                List<BookingServiceItem> serviceItems
        ) {
            this.baseRoomCost = baseRoomCost;
            this.addonServicesCost = addonServicesCost;
            this.subTotal = subTotal;
            this.description = description;
            this.serviceItems = serviceItems;
        }
    }

    public DecoratedCostResult calculateDecoratedCost(Room room, BookingOrder order) {
        long nights = order.getStayNights();
        int guests = order.getGuestCount();

        BookingCostComponent component = new BaseRoomBookingCost(
                room.getName(),
                room.getPricePerNight(),
                nights
        );
        BigDecimal baseCost = component.calculateCost();

        List<BookingServiceItem> items = new ArrayList<>();

        if (order.getAddonServices() != null) {
            for (AddonServiceType serviceType : order.getAddonServices()) {
                BookingServiceDecorator decorator = switch (serviceType) {
                    case BREAKFAST -> new BreakfastDecorator(component, guests, nights);
                    case AIRPORT_PICKUP -> new AirportPickupDecorator(component);
                    case EXTRA_BED -> new ExtraBedDecorator(component, nights);
                    case SPA -> new SpaDecorator(component, guests);
                };
                component = decorator;
                items.add(BookingServiceItem.builder()
                        .serviceType(decorator.getServiceType())
                        .serviceName(decorator.getServiceName())
                        .price(decorator.getServiceCost())
                        .build());
            }
        }

        BigDecimal subTotal = component.calculateCost();
        BigDecimal addonCost = subTotal.subtract(baseCost);

        return new DecoratedCostResult(
                baseCost,
                addonCost,
                subTotal,
                component.getDescription(),
                items
        );
    }
}

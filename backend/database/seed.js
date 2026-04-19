import path from 'path';
import { fileURLToPath } from 'url';

import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databasePath = path.join(__dirname, '..', 'dev.db').replace(/\\/g, '/');
const adapter = new PrismaLibSql({ url: `file:${databasePath}` });
const prisma = new PrismaClient({ adapter });

const categorySeeds = [
    { name: 'Appetizers', subtitle: 'Small plates to start the table' },
    { name: 'Main Courses', subtitle: 'Hearty chef-crafted entrees' },
    { name: 'Desserts', subtitle: 'Sweet finishes for every event' },
    { name: 'Beverages', subtitle: 'House-made drinks and refreshments' },
    { name: 'Breakfast', subtitle: 'Morning catering favorites' },
    { name: 'Brunch Boards', subtitle: 'Sharing platters for late mornings' },
    { name: 'Sandwiches', subtitle: 'Handheld lunches for office groups' },
    { name: 'Salads', subtitle: 'Fresh greens and seasonal toppings' },
    { name: 'Soups', subtitle: 'Warm bowls for cozy service' },
    { name: 'Pasta', subtitle: 'Comforting pasta trays and bowls' },
    { name: 'Seafood', subtitle: 'Fresh selections from the coast' },
    { name: 'Vegetarian', subtitle: 'Plant-forward catering staples' },
    { name: 'Grill Specials', subtitle: 'Fire-grilled proteins and sides' },
    { name: 'Kids Menu', subtitle: 'Simple portions for younger guests' },
    { name: 'Seasonal Specials', subtitle: 'Limited offerings built around the season' },
];

const menuItemSeeds = [
    {
        name: 'Bruschetta Platter',
        subtitle: 'Tomato basil crostini',
        description: 'Toasted baguette with tomato, basil, garlic, and olive oil.',
        price: 24.99,
        categoryName: 'Appetizers',
    },
    {
        name: 'Rosemary Chicken Plate',
        subtitle: 'Lemon pan sauce',
        description: 'Airline chicken breast with roasted potatoes and charred vegetables.',
        price: 32.5,
        categoryName: 'Main Courses',
    },
    {
        name: 'Mini Cheesecake Trio',
        subtitle: 'Classic dessert sampler',
        description: 'Individual cheesecakes with strawberry, caramel, and chocolate toppings.',
        price: 13.5,
        categoryName: 'Desserts',
    },
    {
        name: 'Fresh Mint Lemonade',
        subtitle: 'House refreshment',
        description: 'Freshly squeezed lemonade finished with mint and sparkling water.',
        price: 6.5,
        categoryName: 'Beverages',
    },
    {
        name: 'Sunrise Breakfast Burrito',
        subtitle: 'Egg and cheddar wrap',
        description: 'Scrambled eggs, cheddar, roasted potatoes, and pico de gallo in a warm tortilla.',
        price: 11.25,
        categoryName: 'Breakfast',
    },
    {
        name: 'Smoked Salmon Brunch Board',
        subtitle: 'Bagels and fixings',
        description: 'Smoked salmon, whipped cream cheese, sliced vegetables, capers, and bagels.',
        price: 48.0,
        categoryName: 'Brunch Boards',
    },
    {
        name: 'Turkey Club Sandwich Box',
        subtitle: 'Office lunch favorite',
        description: 'Turkey club on multigrain with chips, fruit cup, and cookie.',
        price: 16.75,
        categoryName: 'Sandwiches',
    },
    {
        name: 'Citrus Kale Salad',
        subtitle: 'Bright and crisp',
        description: 'Kale, shaved fennel, oranges, almonds, parmesan, and citrus vinaigrette.',
        price: 14.0,
        categoryName: 'Salads',
    },
    {
        name: 'Roasted Tomato Bisque',
        subtitle: 'Creamy soup service',
        description: 'Slow-roasted tomato soup with basil cream and garlic croutons.',
        price: 9.5,
        categoryName: 'Soups',
    },
    {
        name: 'Penne Primavera Tray',
        subtitle: 'Vegetable pasta tray',
        description: 'Penne pasta tossed with seasonal vegetables and parmesan cream sauce.',
        price: 26.0,
        categoryName: 'Pasta',
    },
    {
        name: 'Garlic Butter Salmon',
        subtitle: 'Coastal entree',
        description: 'Baked salmon fillet finished with garlic butter and herbs.',
        price: 35.0,
        categoryName: 'Seafood',
    },
    {
        name: 'Stuffed Portobello',
        subtitle: 'Vegetarian centerpiece',
        description: 'Roasted portobello mushroom stuffed with quinoa, spinach, and feta.',
        price: 22.75,
        categoryName: 'Vegetarian',
    },
    {
        name: 'Grilled Sirloin Medallions',
        subtitle: 'Premium carving option',
        description: 'Grilled sirloin medallions with chimichurri and blistered vegetables.',
        price: 39.5,
        categoryName: 'Grill Specials',
    },
    {
        name: 'Kids Mac and Cheese Cups',
        subtitle: 'Kid-friendly individual portions',
        description: 'Creamy baked macaroni and cheese served in individual cups.',
        price: 8.25,
        categoryName: 'Kids Menu',
    },
    {
        name: 'Harvest Flatbread',
        subtitle: 'Seasonal vegetarian option',
        description: 'Flatbread topped with roasted squash, goat cheese, arugula, and chili honey.',
        price: 18.5,
        categoryName: 'Seasonal Specials',
    },
];

const clientSeeds = [
    { firstName: 'Ava', lastName: 'Thompson', email: 'ava.thompson@example.com', phone: '5551000001', note: 'Prefers text confirmations.' },
    { firstName: 'Noah', lastName: 'Patel', email: 'noah.patel@example.com', phone: '5551000002', note: 'Orders monthly team lunches.' },
    { firstName: 'Mia', lastName: 'Garcia', email: 'mia.garcia@example.com', phone: '5551000003', note: 'Needs vegetarian-friendly options.' },
    { firstName: 'Liam', lastName: 'Nguyen', email: 'liam.nguyen@example.com', phone: '5551000004', note: null },
    { firstName: 'Emma', lastName: 'Brooks', email: 'emma.brooks@example.com', phone: '5551000005', note: 'Books early morning deliveries.' },
    { firstName: 'Ethan', lastName: 'Reed', email: 'ethan.reed@example.com', phone: '5551000006', note: null },
    { firstName: 'Olivia', lastName: 'Diaz', email: 'olivia.diaz@example.com', phone: '5551000007', note: 'Enjoys dessert add-ons.' },
    { firstName: 'Lucas', lastName: 'Morris', email: 'lucas.morris@example.com', phone: '5551000008', note: null },
    { firstName: 'Sophia', lastName: 'Ward', email: 'sophia.ward@example.com', phone: '5551000009', note: 'Primary contact for school events.' },
    { firstName: 'Mason', lastName: 'Rivera', email: 'mason.rivera@example.com', phone: '5551000010', note: null },
    { firstName: 'Isabella', lastName: 'Foster', email: 'isabella.foster@example.com', phone: '5551000011', note: null },
    { firstName: 'Logan', lastName: 'Price', email: 'logan.price@example.com', phone: '5551000012', note: 'Prefers email quotes.' },
    { firstName: 'Amelia', lastName: 'Bennett', email: 'amelia.bennett@example.com', phone: '5551000013', note: null },
    { firstName: 'Elijah', lastName: 'Cook', email: 'elijah.cook@example.com', phone: '5551000014', note: null },
    { firstName: 'Harper', lastName: 'Bailey', email: 'harper.bailey@example.com', phone: '5551000015', note: 'Orders family-style trays.' },
    { firstName: 'James', lastName: 'Kelly', email: 'james.kelly@example.com', phone: '5551000016', note: null },
    { firstName: 'Evelyn', lastName: 'Sanchez', email: 'evelyn.sanchez@example.com', phone: '5551000017', note: null },
    { firstName: 'Benjamin', lastName: 'Ross', email: 'benjamin.ross@example.com', phone: '5551000018', note: 'Needs invoices sent same day.' },
    { firstName: 'Abigail', lastName: 'Torres', email: 'abigail.torres@example.com', phone: '5551000019', note: null },
    { firstName: 'Henry', lastName: 'Peterson', email: 'henry.peterson@example.com', phone: '5551000020', note: null },
    { firstName: 'Emily', lastName: 'Hughes', email: 'emily.hughes@example.com', phone: '5551000021', note: 'Event planner referral account.' },
    { firstName: 'Alexander', lastName: 'Flores', email: 'alexander.flores@example.com', phone: '5551000022', note: null },
    { firstName: 'Ella', lastName: 'Butler', email: 'ella.butler@example.com', phone: '5551000023', note: null },
    { firstName: 'Michael', lastName: 'Barnes', email: 'michael.barnes@example.com', phone: '5551000024', note: 'Frequently requests gluten-free trays.' },
    { firstName: 'Scarlett', lastName: 'Coleman', email: 'scarlett.coleman@example.com', phone: '5551000025', note: null },
    { firstName: 'Daniel', lastName: 'Jenkins', email: 'daniel.jenkins@example.com', phone: '5551000026', note: null },
    { firstName: 'Grace', lastName: 'Perry', email: 'grace.perry@example.com', phone: '5551000027', note: 'Prefers Saturday pickups.' },
    { firstName: 'Matthew', lastName: 'Powell', email: 'matthew.powell@example.com', phone: '5551000028', note: null },
    { firstName: 'Chloe', lastName: 'Long', email: 'chloe.long@example.com', phone: '5551000029', note: null },
    { firstName: 'Jackson', lastName: 'Parker', email: 'jackson.parker@example.com', phone: '5551000030', note: 'Large quarterly catering account.' },
];

const orderSeeds = [
    {
        clientEmail: 'ava.thompson@example.com',
        status: 'confirmed',
        discount: 5,
        deliveryDate: '2026-04-10T12:30:00Z',
        items: [
            { menuItemName: 'Bruschetta Platter', quantity: 1 },
            { menuItemName: 'Garlic Butter Salmon', quantity: 1 },
            { menuItemName: 'Fresh Mint Lemonade', quantity: 2 },
        ],
    },
    {
        clientEmail: 'noah.patel@example.com',
        status: 'pending',
        discount: 0,
        deliveryDate: '2026-04-12T18:00:00Z',
        items: [
            { menuItemName: 'Turkey Club Sandwich Box', quantity: 2 },
            { menuItemName: 'Citrus Kale Salad', quantity: 1 },
            { menuItemName: 'Mini Cheesecake Trio', quantity: 1 },
        ],
    },
    {
        clientEmail: 'mia.garcia@example.com',
        status: 'completed',
        discount: 10,
        deliveryDate: '2026-04-03T16:00:00Z',
        items: [
            { menuItemName: 'Penne Primavera Tray', quantity: 1 },
            { menuItemName: 'Stuffed Portobello', quantity: 2 },
            { menuItemName: 'Fresh Mint Lemonade', quantity: 4 },
        ],
    },
    {
        clientEmail: 'liam.nguyen@example.com',
        status: 'confirmed',
        discount: 8,
        deliveryDate: '2026-04-15T11:00:00Z',
        items: [
            { menuItemName: 'Rosemary Chicken Plate', quantity: 2 },
            { menuItemName: 'Roasted Tomato Bisque', quantity: 2 },
        ],
    },
    {
        clientEmail: 'emma.brooks@example.com',
        status: 'pending',
        discount: 0,
        deliveryDate: '2026-04-19T08:30:00Z',
        items: [
            { menuItemName: 'Sunrise Breakfast Burrito', quantity: 8 },
            { menuItemName: 'Fresh Mint Lemonade', quantity: 4 },
        ],
    },
    {
        clientEmail: 'ethan.reed@example.com',
        status: 'completed',
        discount: 12,
        deliveryDate: '2026-04-05T17:45:00Z',
        items: [
            { menuItemName: 'Grilled Sirloin Medallions', quantity: 2 },
            { menuItemName: 'Harvest Flatbread', quantity: 2 },
            { menuItemName: 'Mini Cheesecake Trio', quantity: 2 },
        ],
    },
    {
        clientEmail: 'olivia.diaz@example.com',
        status: 'confirmed',
        discount: 6,
        deliveryDate: '2026-04-22T13:15:00Z',
        items: [
            { menuItemName: 'Smoked Salmon Brunch Board', quantity: 1 },
            { menuItemName: 'Citrus Kale Salad', quantity: 2 },
        ],
    },
    {
        clientEmail: 'lucas.morris@example.com',
        status: 'cancelled',
        discount: 0,
        deliveryDate: '2026-04-25T19:00:00Z',
        items: [
            { menuItemName: 'Rosemary Chicken Plate', quantity: 1 },
            { menuItemName: 'Turkey Club Sandwich Box', quantity: 3 },
        ],
    },
    {
        clientEmail: 'sophia.ward@example.com',
        status: 'completed',
        discount: 4,
        deliveryDate: '2026-04-08T14:00:00Z',
        items: [
            { menuItemName: 'Kids Mac and Cheese Cups', quantity: 10 },
            { menuItemName: 'Fresh Mint Lemonade', quantity: 6 },
        ],
    },
    {
        clientEmail: 'mason.rivera@example.com',
        status: 'pending',
        discount: 0,
        deliveryDate: '2026-04-28T12:00:00Z',
        items: [
            { menuItemName: 'Bruschetta Platter', quantity: 2 },
            { menuItemName: 'Penne Primavera Tray', quantity: 1 },
            { menuItemName: 'Mini Cheesecake Trio', quantity: 2 },
        ],
    },
    {
        clientEmail: 'isabella.foster@example.com',
        status: 'confirmed',
        discount: 7,
        deliveryDate: '2026-04-30T18:30:00Z',
        items: [
            { menuItemName: 'Harvest Flatbread', quantity: 3 },
            { menuItemName: 'Stuffed Portobello', quantity: 2 },
        ],
    },
    {
        clientEmail: 'logan.price@example.com',
        status: 'completed',
        discount: 5,
        deliveryDate: '2026-04-02T15:30:00Z',
        items: [
            { menuItemName: 'Garlic Butter Salmon', quantity: 2 },
            { menuItemName: 'Roasted Tomato Bisque', quantity: 3 },
        ],
    },
    {
        clientEmail: 'amelia.bennett@example.com',
        status: 'pending',
        discount: 0,
        deliveryDate: '2026-05-01T10:15:00Z',
        items: [
            { menuItemName: 'Sunrise Breakfast Burrito', quantity: 6 },
            { menuItemName: 'Smoked Salmon Brunch Board', quantity: 1 },
        ],
    },
    {
        clientEmail: 'elijah.cook@example.com',
        status: 'confirmed',
        discount: 9,
        deliveryDate: '2026-05-03T16:45:00Z',
        items: [
            { menuItemName: 'Grilled Sirloin Medallions', quantity: 1 },
            { menuItemName: 'Citrus Kale Salad', quantity: 2 },
            { menuItemName: 'Mini Cheesecake Trio', quantity: 2 },
        ],
    },
    {
        clientEmail: 'harper.bailey@example.com',
        status: 'completed',
        discount: 15,
        deliveryDate: '2026-04-01T17:00:00Z',
        items: [
            { menuItemName: 'Rosemary Chicken Plate', quantity: 3 },
            { menuItemName: 'Harvest Flatbread', quantity: 2 },
            { menuItemName: 'Fresh Mint Lemonade', quantity: 8 },
        ],
    },
];

async function upsertCategories() {
    const categoriesByName = new Map();

    for (const categorySeed of categorySeeds) {
        const category = await prisma.category.upsert({
            where: { name: categorySeed.name },
            update: { subtitle: categorySeed.subtitle },
            create: categorySeed,
        });

        categoriesByName.set(category.name, category);
    }

    return categoriesByName;
}

async function upsertMenuItems(categoriesByName) {
    const menuItemsByName = new Map();

    for (const menuItemSeed of menuItemSeeds) {
        const category = categoriesByName.get(menuItemSeed.categoryName);
        if (!category) {
            throw new Error(`Missing category for menu item: ${menuItemSeed.name}`);
        }

        const existingMenuItem = await prisma.menuItem.findFirst({
            where: {
                name: menuItemSeed.name,
                categoryId: category.id,
            },
        });

        const data = {
            name: menuItemSeed.name,
            subtitle: menuItemSeed.subtitle,
            description: menuItemSeed.description,
            price: menuItemSeed.price,
            categoryId: category.id,
        };

        const menuItem = existingMenuItem
            ? await prisma.menuItem.update({
                where: { id: existingMenuItem.id },
                data,
            })
            : await prisma.menuItem.create({ data });

        menuItemsByName.set(menuItem.name, menuItem);
    }

    return menuItemsByName;
}

async function upsertClients() {
    const clientsByEmail = new Map();

    for (const clientSeed of clientSeeds) {
        const client = await prisma.client.upsert({
            where: { email: clientSeed.email },
            update: {
                firstName: clientSeed.firstName,
                lastName: clientSeed.lastName,
                phone: clientSeed.phone,
                note: clientSeed.note,
            },
            create: clientSeed,
        });

        clientsByEmail.set(client.email, client);
    }

    return clientsByEmail;
}

async function upsertOrders(clientsByEmail, menuItemsByName) {
    for (const [index, orderSeed] of orderSeeds.entries()) {
        const client = clientsByEmail.get(orderSeed.clientEmail);
        if (!client) {
            throw new Error(`Missing client for order seed: ${orderSeed.clientEmail}`);
        }

        const note = `seed-order-${String(index + 1).padStart(2, '0')}`;
        const deliveryDate = new Date(orderSeed.deliveryDate);

        const pricedItems = orderSeed.items.map((itemSeed) => {
            const menuItem = menuItemsByName.get(itemSeed.menuItemName);
            if (!menuItem) {
                throw new Error(`Missing menu item for order seed: ${itemSeed.menuItemName}`);
            }

            return {
                menuItem,
                quantity: itemSeed.quantity,
                lineTotal: menuItem.price * itemSeed.quantity,
            };
        });

        const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);
        const total = Number((subtotal - orderSeed.discount).toFixed(2));

        const existingOrder = await prisma.order.findFirst({
            where: { note },
        });

        const order = existingOrder
            ? await prisma.order.update({
                where: { id: existingOrder.id },
                data: {
                    clientId: client.id,
                    total,
                    discount: orderSeed.discount,
                    status: orderSeed.status,
                    deliveryDate,
                    note,
                },
            })
            : await prisma.order.create({
                data: {
                    clientId: client.id,
                    total,
                    discount: orderSeed.discount,
                    status: orderSeed.status,
                    deliveryDate,
                    note,
                },
            });

        for (const [itemIndex, pricedItem] of pricedItems.entries()) {
            const itemNote = `${note}-item-${String(itemIndex + 1).padStart(2, '0')}`;
            const existingOrderItem = await prisma.orderItem.findFirst({
                where: { note: itemNote },
            });

            const orderItemData = {
                orderId: order.id,
                menuItemId: pricedItem.menuItem.id,
                quantity: pricedItem.quantity,
                price: pricedItem.menuItem.price,
                note: itemNote,
            };

            if (existingOrderItem) {
                await prisma.orderItem.update({
                    where: { id: existingOrderItem.id },
                    data: orderItemData,
                });
            } else {
                await prisma.orderItem.create({
                    data: orderItemData,
                });
            }
        }
    }
}

async function main() {
    const categoriesByName = await upsertCategories();
    const menuItemsByName = await upsertMenuItems(categoriesByName);
    const clientsByEmail = await upsertClients();

    await upsertOrders(clientsByEmail, menuItemsByName);

    const [categoryCount, menuItemCount, clientCount, orderCount, orderItemCount] =
        await Promise.all([
            prisma.category.count(),
            prisma.menuItem.count(),
            prisma.client.count(),
            prisma.order.count(),
            prisma.orderItem.count(),
        ]);

    console.log('Seed data ensured successfully.');
    console.log(
        `Counts -> categories: ${categoryCount}, menu items: ${menuItemCount}, clients: ${clientCount}, orders: ${orderCount}, order items: ${orderItemCount}`
    );
}

main()
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

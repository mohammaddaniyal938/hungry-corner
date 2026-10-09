/* eslint-disable no-console */
// Usage: npm run seed            (refuses to run when NODE_ENV=production)
//        npm run seed -- --force (override)
const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/database');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const karachiBitesProducts = require('./karachiBitesProducts.json'); // the products already shown in the front-end

const PASSWORDS = { admin: 'Admin@12345', restaurantAdmin: 'Restaurant@123', customer: 'Customer@123' };

// "15-20 min" -> 20
const toMinutes = (s) => Math.max(...(String(s).match(/\d+/g) || [15]).map(Number));

const restaurants = [
  {
    key: 'karachi-bites',
    owner: 'owner1',
    data: {
      name: 'Karachi Bites',
      description: 'Charcoal-grilled burgers, shawarma and wood-fired pizza straight from the heart of Karachi.',
      phone: '+922135001001', email: 'hello@karachibites.pk', address: 'Shop 4, Boat Basin, Clifton', city: 'Karachi',
      openingTime: '11:00', closingTime: '02:00', deliveryFee: 150, minimumOrder: 500,
    },
    categories: ['Burgers', 'Shawarma', 'Pizza', 'Sides', 'Drinks', 'Deals'],
    // Built from the existing front-end product list so the API and the UI agree.
    items: karachiBitesProducts.map((p) => ({
      category: p.category, name: p.title, description: p.description, price: p.price, image: p.image,
      ingredients: p.ingredients, preparationTime: toMinutes(p.prepTime),
    })),
  },
  {
    key: 'pizza-palace',
    owner: 'owner2',
    data: {
      name: 'Pizza Palace',
      description: 'Hand-tossed pizzas, creamy pastas and desserts for the whole family.',
      phone: '+922135002002', email: 'orders@pizzapalace.pk', address: '12 Tariq Road, PECHS', city: 'Karachi',
      openingTime: '12:00', closingTime: '00:00', deliveryFee: 120, minimumOrder: 600,
    },
    categories: ['Pizza', 'Pasta', 'Sides', 'Drinks', 'Desserts'],
    items: [
      ['Pizza', 'Tikka Supreme Pizza', 'Chicken tikka, onions and peppers on a stone-baked crust.', 1450, 1299, ['Chicken Tikka', 'Mozzarella', 'Onion', 'Capsicum'], 25],
      ['Pizza', 'Pepperoni Classic', 'Loaded with beef pepperoni and mozzarella.', 1550, null, ['Pepperoni', 'Mozzarella', 'Tomato Sauce'], 25],
      ['Pizza', 'Margherita', 'Tomato, mozzarella and fresh basil.', 1100, null, ['Tomato', 'Mozzarella', 'Basil'], 20],
      ['Pizza', 'BBQ Chicken Pizza', 'Smoky BBQ sauce, grilled chicken and red onion.', 1500, 1399, ['Chicken', 'BBQ Sauce', 'Onion', 'Mozzarella'], 25],
      ['Pasta', 'Creamy Alfredo Pasta', 'Fettuccine in a garlic parmesan cream sauce.', 950, null, ['Fettuccine', 'Cream', 'Parmesan', 'Garlic'], 18],
      ['Pasta', 'Spicy Arrabbiata', 'Penne in a fiery tomato and chilli sauce.', 850, null, ['Penne', 'Tomato', 'Chilli', 'Garlic'], 15],
      ['Pasta', 'Baked Lasagna', 'Layers of beef ragù and béchamel, baked golden.', 1150, 1050, ['Beef', 'Pasta Sheets', 'Béchamel', 'Cheese'], 30],
      ['Sides', 'Garlic Bread with Cheese', 'Toasted baguette with garlic butter and cheese.', 450, null, ['Baguette', 'Garlic Butter', 'Cheese'], 10],
      ['Sides', 'Chicken Wings (8 Pcs)', 'Crispy wings tossed in hot sauce.', 750, null, ['Chicken Wings', 'Hot Sauce'], 18],
      ['Drinks', 'Mint Margarita', 'Fresh mint, lemon and soda.', 300, null, ['Mint', 'Lemon', 'Soda'], 5],
      ['Drinks', 'Soft Drink 500ml', 'Chilled soft drink.', 120, null, [], 2],
      ['Desserts', 'Chocolate Lava Cake', 'Warm cake with a molten chocolate centre.', 550, null, ['Chocolate', 'Flour', 'Eggs'], 12],
      ['Desserts', 'New York Cheesecake', 'Classic baked cheesecake with berry compote.', 650, 599, ['Cream Cheese', 'Biscuit Base', 'Berries'], 5],
    ].map(([category, name, description, price, discountPrice, ingredients, preparationTime]) => ({
      category, name, description, price, discountPrice, ingredients, preparationTime,
    })),
  },
  {
    key: 'desi-dhaba',
    owner: 'owner1',
    data: {
      name: 'Desi Dhaba',
      description: 'Authentic BBQ, karahi and dum biryani cooked the traditional way.',
      phone: '+922135003003', email: 'info@desidhaba.pk', address: 'Block 5, Gulshan-e-Iqbal', city: 'Karachi',
      openingTime: '12:00', closingTime: '01:00', deliveryFee: 100, minimumOrder: 400,
    },
    categories: ['BBQ', 'Karahi', 'Biryani', 'Breads', 'Drinks'],
    items: [
      ['BBQ', 'Chicken Tikka (4 Pcs)', 'Char-grilled marinated chicken pieces.', 700, null, ['Chicken', 'Yogurt', 'Spices'], 25],
      ['BBQ', 'Seekh Kabab (6 Pcs)', 'Minced beef kababs grilled on skewers.', 850, 799, ['Beef Mince', 'Onion', 'Green Chilli', 'Spices'], 25],
      ['BBQ', 'Malai Boti', 'Creamy tender chicken boti.', 900, null, ['Chicken', 'Cream', 'Cheese'], 25],
      ['Karahi', 'Chicken Karahi (Half)', 'Wok-cooked with tomatoes, ginger and green chilli.', 1400, null, ['Chicken', 'Tomato', 'Ginger', 'Green Chilli'], 30],
      ['Karahi', 'Mutton Karahi (Half)', 'Slow-cooked mutton karahi.', 2400, 2250, ['Mutton', 'Tomato', 'Ginger', 'Spices'], 40],
      ['Karahi', 'Daal Mash', 'Slow-simmered lentils finished with butter.', 550, null, ['Mash Daal', 'Butter', 'Ginger'], 15],
      ['Biryani', 'Chicken Biryani', 'Aromatic basmati layered with spiced chicken.', 600, null, ['Basmati Rice', 'Chicken', 'Spices'], 20],
      ['Biryani', 'Beef Biryani', 'Karachi-style beef biryani.', 700, null, ['Basmati Rice', 'Beef', 'Potato', 'Spices'], 20],
      ['Biryani', 'Special Pulao', 'Fragrant yakhni pulao with raita.', 650, null, ['Rice', 'Beef Stock', 'Spices'], 20],
      ['Breads', 'Butter Naan', 'Tandoor-baked naan brushed with butter.', 80, null, ['Flour', 'Butter'], 8],
      ['Breads', 'Roghni Naan', 'Sesame-topped soft naan.', 100, null, ['Flour', 'Sesame'], 8],
      ['Drinks', 'Sweet Lassi', 'Thick chilled yogurt drink.', 250, null, ['Yogurt', 'Sugar'], 5],
      ['Drinks', 'Doodh Patti Chai', 'Strong milky tea.', 150, null, ['Tea', 'Milk', 'Sugar'], 8],
    ].map(([category, name, description, price, discountPrice, ingredients, preparationTime]) => ({
      category, name, description, price, discountPrice, ingredients, preparationTime,
    })),
  },
];

async function seed() {
  if (env.isProd && !process.argv.includes('--force')) {
    throw new Error('Refusing to seed (wipe) a production database. Re-run with --force if you are sure.');
  }
  await connectDB();
  console.log(`Seeding ${env.mongoUri} ...`);
  await Promise.all([User, Restaurant, Category, MenuItem, Cart, Order, Coupon].map((m) => m.deleteMany({})));
  // Rebuild indexes (e.g. collation-based unique index) after wiping.
  await Promise.all([User, Restaurant, Category, MenuItem, Cart, Order, Coupon].map((m) => m.syncIndexes()));

  const mk = (name, email, role, pw, phone) => User.create({ name, email, role, password: pw, phone });
  const users = {
    admin: await mk('Super Admin', 'admin@karachibites.com', 'admin', PASSWORDS.admin, '+923000000001'),
    owner1: await mk('Ayesha Khan', 'owner1@karachibites.com', 'restaurant_admin', PASSWORDS.restaurantAdmin, '+923000000002'),
    owner2: await mk('Bilal Ahmed', 'owner2@karachibites.com', 'restaurant_admin', PASSWORDS.restaurantAdmin, '+923000000003'),
    c1: await mk('Sara Malik', 'sara@example.com', 'customer', PASSWORDS.customer, '+923001111111'),
    c2: await mk('Usman Raza', 'usman@example.com', 'customer', PASSWORDS.customer, '+923002222222'),
    c3: await mk('Hina Siddiqui', 'hina@example.com', 'customer', PASSWORDS.customer, '+923003333333'),
  };

  const summary = [];
  for (const r of restaurants) {
    const restaurant = await Restaurant.create({ ...r.data, owner: users[r.owner]._id });
    const cats = {};
    for (const [i, name] of r.categories.entries()) {
      cats[name] = await Category.create({ restaurant: restaurant._id, name, sortOrder: i + 1, description: `${name} at ${restaurant.name}` });
    }
    const docs = r.items.map((it) => {
      const { category, ...rest } = it;
      return { ...rest, restaurant: restaurant._id, category: cats[category]._id, discountPrice: rest.discountPrice ?? null };
    });
    for (const d of docs) await MenuItem.create(d); // create() so the finalPrice hook runs
    summary.push(`${restaurant.name}: ${r.categories.length} categories, ${docs.length} menu items`);
  }

  await Coupon.create([
    { code: 'WELCOME10', discountType: 'percentage', discountValue: 10, minimumOrder: 500, maximumDiscount: 300, expiryDate: new Date(Date.now() + 365 * 86400000), usageLimit: 1000 },
    { code: 'FLAT200', discountType: 'fixed', discountValue: 200, minimumOrder: 1500, expiryDate: new Date(Date.now() + 365 * 86400000) },
  ]);

  console.log('\nSeed complete');
  summary.forEach((s) => console.log(' -', s));
  console.log('\nLogins');
  console.log(`  Super admin       admin@karachibites.com   / ${PASSWORDS.admin}`);
  console.log(`  Restaurant admins owner1@karachibites.com  / ${PASSWORDS.restaurantAdmin}  (Karachi Bites, Desi Dhaba)`);
  console.log(`                    owner2@karachibites.com  / ${PASSWORDS.restaurantAdmin}  (Pizza Palace)`);
  console.log(`  Customers         sara@example.com, usman@example.com, hina@example.com / ${PASSWORDS.customer}`);
  console.log('  Coupons           WELCOME10 (10% up to 300, min 500), FLAT200 (200 off, min 1500)');
  await disconnectDB();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});

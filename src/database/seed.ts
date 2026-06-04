/**
 * Database Seed Script
 * --------------------
 * Generates realistic test data for development and load testing.
 *
 * Usage:
 *   npm run seed                  → adds data on top of existing
 *   npm run seed -- --fresh       → wipes everything first, then seeds
 *
 * All seeded users share the same password: Password123!
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

import { User } from '../modules/users/users.entity';
import { ProductOrmEntity } from '../modules/products/infrastructure/persistence/typeorm/product.orm-entity';
import { CategoryOrmEntity } from '../modules/categories/infrastructure/persistence/typeorm/category.orm-entity';
import { Order, orderMethods, orderStatus } from '../modules/order/entity/order.entity';
import { OrderItem } from '../modules/order/entity/orderItem.entity';

// ─── Config ──────────────────────────────────────────────────────────────────

const CONFIG = {
  customers:          100,   // how many customer accounts to create
  providers:          10,    // how many provider (seller) accounts to create
  productsPerProvider: 20,   // products each provider lists
  ordersPerCustomer:   5,    // orders each customer places
};

const SEED_PASSWORD = 'Password123!';

const CATEGORIES = [
  'Pain Relief',
  'Vitamins & Supplements',
  'First Aid',
  'Cold & Flu',
  'Digestive Health',
  'Heart Health',
  'Diabetes Care',
  'Baby & Child',
  'Medical Devices',
  'Skin Care',
];

// ─── DB Connection ───────────────────────────────────────────────────────────

const db = new DataSource({
  type: 'postgres',
  host:     process.env.DATABASE_HOST     || 'localhost',
  port:     parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME     || 'nest_market',
  entities: [User, ProductOrmEntity, CategoryOrmEntity, Order, OrderItem],
  synchronize: false,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  const isFresh = process.argv.includes('--fresh');

  await db.initialize();
  console.log('✅  Connected to database\n');

  // ── Optional wipe ──────────────────────────────────────────────────────────
  if (isFresh) {
    await db.query(`
      TRUNCATE TABLE "order_item", "order", "products", "categories", "users"
      RESTART IDENTITY CASCADE
    `);
    console.log('🗑️   Wiped existing data\n');
  }

  // ── 1. Categories ──────────────────────────────────────────────────────────
  const categoryRepo = db.getRepository(CategoryOrmEntity);
  const categories = await categoryRepo.save(
    CATEGORIES.map(name =>
      categoryRepo.create({ name, description: faker.lorem.sentence() }),
    ),
  );
  console.log(`📦  Created ${categories.length} categories`);

  // ── 2. Users ───────────────────────────────────────────────────────────────
  const userRepo  = db.getRepository(User);
  const hashed    = await bcrypt.hash(SEED_PASSWORD, 10);

  const providers = await userRepo.save(
    Array.from({ length: CONFIG.providers }, (_, i) =>
      userRepo.create({
        name:          faker.person.fullName(),
        email:         `provider${i + 1}@test.com`,
        password:      hashed,
        role:          'provider',
        emailVerified: true,
      }),
    ),
  );
  console.log(`👨‍⚕️   Created ${providers.length} providers`);

  const customers = await userRepo.save(
    Array.from({ length: CONFIG.customers }, (_, i) =>
      userRepo.create({
        name:          faker.person.fullName(),
        email:         `customer${i + 1}@test.com`,
        password:      hashed,
        role:          'customer',
        emailVerified: true,
      }),
    ),
  );
  console.log(`🧑   Created ${customers.length} customers`);

  // ── 3. Products ────────────────────────────────────────────────────────────
  const productRepo = db.getRepository(ProductOrmEntity);
  const products    = await productRepo.save(
    providers.flatMap(provider =>
      Array.from({ length: CONFIG.productsPerProvider }, () =>
        productRepo.create({
          name:              faker.commerce.productName(),
          price:             parseFloat(faker.commerce.price({ min: 5, max: 500 })),
          userId:            provider.id,
          stock:             faker.number.int({ min: 20, max: 500 }),
          lowStockThreshold: 10,
          categoryId:        pick(categories).id,
        }),
      ),
    ),
  );
  console.log(`💊  Created ${products.length} products`);

  // ── 4. Orders ──────────────────────────────────────────────────────────────
  const orderRepo     = db.getRepository(Order);
  const orderItemRepo = db.getRepository(OrderItem);
  let   totalOrders   = 0;

  for (const customer of customers) {
    for (let i = 0; i < CONFIG.ordersPerCustomer; i++) {
      const selectedProducts = pickMany(products, faker.number.int({ min: 1, max: 5 }));

      const items = selectedProducts.map(product =>
        orderItemRepo.create({
          product,
          quantity: faker.number.int({ min: 1, max: 4 }),
          price:    product.price,
        }),
      );

      const totalPrice = items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
      );

      await orderRepo.save(
        orderRepo.create({
          name:       `Order for ${customer.name}`,
          userId:     customer.id,
          totalPrice: Math.round(totalPrice * 100) / 100,
          items,
          method:     pick(Object.values(orderMethods)),
          status:     pick(Object.values(orderStatus)),
        }),
      );
      totalOrders++;
    }
  }
  console.log(`🛒  Created ${totalOrders} orders`);

  // ── Summary ────────────────────────────────────────────────────────────────
  await db.destroy();

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉  Seeding complete!

    Categories : ${categories.length}
    Providers  : ${providers.length}
    Customers  : ${customers.length}
    Products   : ${products.length}
    Orders     : ${totalOrders}

    Password for ALL seeded users: ${SEED_PASSWORD}

    Example logins:
      provider1@test.com
      customer1@test.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

seed().catch(err => {
  console.error('\n❌  Seeding failed:', err.message);
  process.exit(1);
});

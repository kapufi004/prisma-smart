const express = require("express");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

const app = express();
const prisma = new PrismaClient();

// Settings
app.set("views", path.join(__dirname, "view"));
app.set("view engine", "ejs");

// Middleware
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1);

app.use(session({
    secret: process.env.SESSION_SECRET || "smartwatch-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    }
}));

app.use(express.static("public"));

// Serve the kapufi landing page as static assets
app.use(express.static("kapufi"));

// =========================
// LANDING PAGE
// =========================
app.get("/", (req, res) => {

    res.sendFile(path.join(__dirname, "kapufi", "index.html"));

});

// =========================
// STORE PAGE (product listing)
// =========================
app.get("/store", async (req, res) => {

    try {
        const products = await prisma.product.findMany();
        res.render("index", { products });
    } catch (err) {
        console.error("Store error:", err);
        res.status(500).send("Error loading products");
    }

});

// =========================
// SAVE ORDER
// =========================
app.post("/order", async (req, res) => {

    const { name, email, phone, productId } = req.body;

    try {

        if (!productId) {
            return res.status(400).send("Product ID is required");
        }

        await prisma.order.create({
            data: {
                name,
                email,
                phone,
                productId: parseInt(productId, 10)
            }

        });

        res.redirect("/");

    } catch (error) {

        console.log(error);

        res.send("Error saving order");

    }

});


// =========================
// LOGIN PAGE
// =========================
app.get("/login", (req, res) => {

    res.render("login", {
        error: null
    });

});


// =========================
// HANDLE LOGIN
// =========================
app.post("/login", async (req, res) => {

    const { email, password } = req.body;

    try {

        const admin = await prisma.admin.findFirst({
            where: {
                email,
                password
            }
        });

        if (admin) {

            req.session.adminId = admin.id;
            req.session.adminEmail = admin.email;

            res.redirect("/dashboard");

        } else {

            res.render("login", {
                error: "Invalid Email or Password"
            });

        }

    } catch (error) {

        console.log(error);

        res.send("Login Error");

    }

});


// =========================
// PROTECTED DASHBOARD PAGE
// =========================
app.get("/orders", async (req, res) => {

    try {
        if (!req.session.adminId) {
            return res.redirect("/login");
        }

        const orders = await prisma.order.findMany({
            include: {
                product: true
            }
        });

        res.render("order", {
            orders,
            adminEmail: req.session.adminEmail
        });
    } catch (err) {
        console.error("Orders error:", err);
        res.status(500).send("Error loading orders");
    }

});


// =========================
// LOGOUT
// =========================
app.get("/logout", (req, res) => {

    req.session.destroy(() => {

        res.redirect("/login");

    });

});


// =========================
// TEST ROUTE
// =========================
app.get("/seed", async (req, res) => {

    try {
        const msgs = [];

        // Seed admin
        const admin = await prisma.admin.findUnique({
            where: { email: "admin@smartstore.com" }
        });
        if (!admin) {
            await prisma.admin.create({
                data: { email: "admin@smartstore.com", password: "admin123" }
            });
            msgs.push("Admin created: admin@smartstore.com / admin123");
        } else {
            msgs.push("Admin already exists");
        }

        // Seed products
        const count = await prisma.product.count();
        if (count === 0) {
            const products = [
                { name: "Smart Watch Pro", description: "Premium smartwatch with heart rate monitor, GPS, and 7-day battery life.", price: 250000, image: "/uploads/1781471789423-smart.jpg" },
                { name: "Smart Watch Lite", description: "Affordable smartwatch with fitness tracking and notifications.", price: 120000, image: "/uploads/1781471691632-smart1.jpg" },
                { name: "Smart Watch Sport", description: "Rugged smartwatch designed for athletes with water resistance up to 50m.", price: 180000, image: "/uploads/1781471506684-smart2.png" }
            ];
            for (const p of products) {
                await prisma.product.create({ data: p });
            }
            msgs.push(`Seeded ${products.length} products`);
        } else {
            msgs.push(`Products already exist (${count})`);
        }

        res.send(msgs.join(". ") + `. <a href='/'>Go to home page</a>`);
    } catch (err) {
        console.error("Seed error:", err);
        res.status(500).send("Seed error: " + err.message);
    }

});

app.get("/test", async (req, res) => {

    try {
        const products = await prisma.product.findMany();
        res.json({ count: products.length, dbUrl: (process.env.MYSQL_URL || "none").substring(0, 50) + "..." });
    } catch (err) {
        res.json({ error: err.message });
    }

});

//products page
app.get("/products", async (req, res) => {

    try {
        const products = await prisma.product.findMany();
        res.render("products", { products });
    } catch (err) {
        console.error("Products error:", err);
        res.status(500).send("Error loading products");
    }

});

// Customer: order specific product
app.get("/products/:id/order", async (req, res) => {

    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.send("Invalid product id");
        }

        const product = await prisma.product.findUnique({
            where: { id }
        });

        if (!product) {
            return res.send("Product not found");
        }

        res.render("product-order", { product });
    } catch (err) {
        console.error("Product order error:", err);
        res.status(500).send("Error loading product");
    }

});
// New product form
app.get("/products/new", (req, res) => {

    res.render("new-product");

});

// Handle new product form submission
app.post(
    "/products/new",
    upload.single("image"),
    async (req, res) => {

        try {
            const { name, description, price } = req.body;

            if (!req.file) {
                return res.status(400).send("Image is required");
            }

            const image = "/uploads/" + req.file.filename;

            await prisma.product.create({
                data: {
                    name,
                    description,
                    price: parseFloat(price),
                    image
                }
            });

            res.redirect("/products");
        } catch (err) {
            console.error("Create product error:", err);
            res.status(500).send("Error creating product");
        }

    }
);

//========================
//admin dashboard
// =========================

app.get("/dashboard", async (req, res) => {

    try {
        if (!req.session.adminId) {
            return res.redirect("/login");
        }

        const totalProducts = await prisma.product.count();
        const totalOrders = await prisma.order.count();

        res.render("dashboard", {
            totalProducts,
            totalOrders,
            adminEmail: req.session.adminEmail
        });
    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).send("Error loading dashboard");
    }

});

// Handle product deletion
app.get("/products/delete/:id", async (req, res) => {

    try {
        const id = parseInt(req.params.id);

        await prisma.product.delete({
            where: { id }
        });

        res.redirect("/products");
    } catch (err) {
        console.error("Delete product error:", err);
        res.status(500).send("Error deleting product");
    }

});

//edit product form
app.get("/products/edit/:id", async (req, res) => {

    try {
        const id = parseInt(req.params.id);

        const product = await prisma.product.findUnique({
            where: { id }
        });

        if (!product) {
            return res.send("Product not found");
        }

        res.render("edit-product", { product });
    } catch (err) {
        console.error("Edit product form error:", err);
        res.status(500).send("Error loading product");
    }

});

app.post(
    "/products/edit/:id",
    upload.single("image"),
    async (req, res) => {

        try {
            const id = parseInt(req.params.id);

            const { name, description, price } = req.body;

            const data = {
                name,
                description,
                price: parseFloat(price)
            };

            if (req.file) {
                data.image = "/uploads/" + req.file.filename;
            }

            await prisma.product.update({
                where: { id },
                data
            });

            res.redirect("/products");
        } catch (err) {
            console.error("Update product error:", err);
            res.status(500).send("Error updating product");
        }

    }
);
    

// =========================
// GLOBAL ERROR HANDLER
// =========================
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).send("Internal Server Error");
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server running on http://localhost:${PORT}`);

});

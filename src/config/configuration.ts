export default()=> ({
    port: process.env.PORT!,
    frontendUri : process.env.FRONTEND_URI,
    database:{
        url: process.env.DATABASE_URL,
        host: process.env.DATABASE_HOST!,
        port: parseInt(process.env.DATABASE_PORT!, 10),
        username: process.env.DATABASE_USERNAME!,
        password: process.env.DATABASE_PASSWORD!,
        name: process.env.DATABASE_NAME!,
        ssl: process.env.DATABASE_SSL === 'true'
    },
    jwt:{
        secretKey: process.env.JWT_SECRET_KEY!,
    },
    aws:{
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: process.env.AWS_REGION,
        bucket: process.env.AWS_S3_BUCKET,
        productsPrefix: process.env.AWS_S3_PRODUCTS_PREFIX || 'products',
        usersPrefix: process.env.AWS_S3_USERS_PREFIX || 'users',
    },
    paymob: {
        apiKey: process.env.PAYMOB_API_KEY!,
        integrationId: process.env.PAYMOB_INTEGRATION_ID!,
        iframeId: process.env.PAYMOB_IFRAME_ID!,
        hmacSecret: process.env.PAYMOB_HMAC_SECRET!,
    },
    mail: {
        host: process.env.MAIL_HOST!,
        port: parseInt(process.env.MAIL_PORT!, 10),
        secure: process.env.MAIL_SECURE === 'true',
        user: process.env.MAIL_USER!,
        pass: process.env.MAIL_PASS!,
        from: process.env.MAIL_FROM,
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || '',
    },
})

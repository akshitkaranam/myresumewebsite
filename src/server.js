
import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const nodemailer = require("nodemailer");
const app = express();
require("dotenv").config();

app.use(express.static(path.join(__dirname, '/build')));

app.use(bodyParser.json());

const withDB = async (operations, res) => {

    try {
        const client = await MongoClient.connect('mongodb://localhost:27017')
        const db = client.db('my-blog');
        await operations(db);
        client.close();
    } catch (error) {
        res.status(500).json({ message: "error connecting to db", error })
    }
}

app.get('/api/articles/:name', async (req, res) => {

    withDB(async (db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({
            name: articleName
        }, res);
        res.status(200).json(articleInfo);
    })
})

app.get('/api/articles-list', async (req, res) => {

    withDB(async (db) => {
        const articleInfo = await db.collection('articles')
            .find({}, { projection: { title: 1, name: 1, description: 1, image: 1, _id: 0 } }).toArray();
        res.status(200).json(articleInfo);
    })
})



//UPVOTE SECTION START
app.post('/api/article/:name/upvote', async (req, res) => {

    withDB(async (db) => {
        const articleName = req.params.name;


        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articleInfo.upvotes + 1,
                totalUpvotes: articleInfo.totalUpvotes + 1
            }

        });

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updatedArticleInfo);

    }, res);

})

app.post('/api/article/:name/redoupvote', async (req, res) => {

    withDB(async (db) => {
        const articleName = req.params.name;


        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articleInfo.upvotes - 1,
                totalUpvotes: articleInfo.totalUpvotes - 1
            }

        });

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updatedArticleInfo);

    }, res);

})

app.post('/api/article/:name/downvote', async (req, res) => {

    withDB(async (db) => {
        const articleName = req.params.name;


        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articleInfo.upvotes - 1
            }

        });

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updatedArticleInfo);

    }, res);

})

app.post('/api/article/:name/redodownvote', async (req, res) => {

    withDB(async (db) => {
        const articleName = req.params.name;


        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articleInfo.upvotes + 1
            }

        });

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updatedArticleInfo);

    }, res);

})

app.post('/api/article/:name/upvote2downvote', async (req, res) => {

    withDB(async (db) => {
        const articleName = req.params.name;


        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articleInfo.upvotes - 2,
                totalUpvotes: articleInfo.totalUpvotes - 1
            }

        });

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updatedArticleInfo);

    }, res);

})

app.post('/api/article/:name/downvote2upvote', async (req, res) => {

    withDB(async (db) => {
        const articleName = req.params.name;


        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articleInfo.upvotes + 2,
                totalUpvotes: articleInfo.totalUpvotes + 1
            }

        });

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updatedArticleInfo);

    }, res);

})
//UPVOTE SECTION END





app.post('/api/articles/:name/add-comment', (req, res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;

    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articleInfo.comments.concat({ username, text })
            },
        });

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });;
        res.status(200).json(updatedArticleInfo)


    }, res);

});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, () => console.log('Listening on port 8000'));


let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: process.env.EMAIL,
        pass: process.env.WORD,
        clientId: process.env.OAUTH_CLIENTID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        refreshToken: process.env.OAUTH_REFRESH_TOKEN,
    },
});

transporter.verify((err, success) => {
    err
        ? console.log(err)
        : console.log(`=== Server is ready to take messages: ${success} ===`);
});

app.post("/send", function (req, res) {
    let mailOptions = {
        from: `${req.body.mailerState.email}`,
        to: process.env.EMAIL,
        subject: `New Message on your Resume Website from: ${req.body.mailerState.name}, email: ${req.body.mailerState.email} `,
        text: `${req.body.mailerState.message}`,
      };

    transporter.sendMail(mailOptions, function (err, data) {
        if (err) {
            res.json({
              status: "fail",
            });
          } else {
            console.log("== Message Sent ==");
            res.json({
              status: "success",
            });
          }
    });
});

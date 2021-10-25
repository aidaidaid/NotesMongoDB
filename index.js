const express = require('express');
const mongo = require('mongodb').MongoClient;
const url = 'mongodb+srv://nodeUser:nodePassword@cluster0.qe4cp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
const ObjectId = require('mongodb').ObjectId;
const app = express();
app.use(express.json());
let cors = require('cors');
app.use(cors());

const handleRoot = (_, res) => {
    res.end('server is working')
}

const checkIsNoteCorrect = (note) => {
    if (note && 'id' in note && ('title' in note || 'content' in note)) {
        return true;
    }
    return false;
}

const handleGetNotes = (req, res, db ) => {
    db
    .collection('notes')
    .find({}).toArray(function (err, notes) {
        res.statusCode = 200;
        res.end(JSON.stringify(notes.map(note => {
            return { id: note._id, title: note.title, content: note.content };
        })));
    });
}

const handleDeleteNote = (req, res, db ) => {
    if (req.body.id) {
        const id = req.body.id;
        db
        .collection('notes')
        .deleteOne({id})
        .then(_ => {
            res.statusCode = 200;
            res.end('Note was deleted');
        })
        .catch(e => {
            res.statusCode = 500;
            res.end('Error deleting note');
            console.error('handleDeleteNote', e);
        })
    } else {
        res.statusCode = 400;
        res.end('Not valid data');
    }
}

const handleEditNote = (req, res, db) => {
    if (req.body.id) {
        const id = req.body.id;
        db
        .collection('notes')
        .updateOne({id}, {$set: req.body})
        .then(_ => {
            res.statusCode = 200;
            res.end('Note was edited');
        })
        .catch(e => {
            res.statusCode = 500;
            res.end('Error editing note');
            console.error('handleEditNote', e);
        })
    } else {
        res.statusCode = 400;
        res.end('Not valid data');
    }
}

const handleAddNote = (req, res, db ) => {
    const isCorrect = checkIsNoteCorrect(req.body);
    if (isCorrect) {
        if (db) {
            const {id, title, content} = req.body;
            const newNote = { id, title, content };
            db
            .collection('notes').insertOne(newNote)
            .then(data => {
                newNote.id = data.insertedId;
                console.log(data)
                res.statusCode = 201;
                res.end('Note successfully added')
            })
            .catch(e => {
                console.error('handleAddNote', e)
                res.statusCode = 500;
                res.end('Error adding note')
            })
        }
    } else {
        res.statusCode = 400;
        res.end('Not valid data');
    }
}

mongo.connect(url, (err, client) => {
    if (err) return err;
    const db = client.db('nodeTest')

    app.get('/', handleRoot);
    app.get('/note', (req, res) => handleGetNotes(req, res, db));
    app.post('/note', (req, res) => handleAddNote(req, res, db));
    app.delete('/note', (req, res) => handleDeleteNote(req, res, db));
    app.put('/note', (req, res) => handleEditNote(req, res, db));

    app.listen(5000, () => {
        console.log('listening to 5000')
    })
})
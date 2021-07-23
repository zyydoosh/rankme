const express = require('express');
const multer = require('multer');
const { populate, findByIdAndRemove } = require('../models/job');
const Jobs = require('../models/job');
const fsExtra = require('fs-extra');
const dirPath = 'public/resumes';

const cors = require('./cors');

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, dirPath)
    },
    filename: (req, file, callback) => {
        callback(null, Date.now() + '$' + file.originalname)
    }
});

const fileFilter = (req, file, callback) => {
    if(!file.originalname.match(/\.(pdf|docx|doc)$/))
    {
        return callback(new Error('Only supported formats are pdf, docx, and doc'));
    }
    callback(null, true);
};

const upload = multer({storage: storage, fileFilter:fileFilter});

const fileUpload = express.Router();

// req.body.resumes = req.files;
fileUpload.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req, res, next) => {
    Jobs.find({})
    .then((jobs) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(jobs);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, upload.array('filefield', 10000), (req, res, next) => {
    Jobs.create(req.body)
    .then((job) => {
        req.files.map((file) => {
            job.resumes = job.resumes.concat({filename: file.filename, path: file.path, percentage: Math.random(), jobId: job._id});
        });
        job.save()
        .then((job) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({sucess: "true", job: job});
        }, (err) => next(err))
        .catch((err) => next(err));
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /jobs');
})
.delete(cors.cors, (req, res, next) => {
    fsExtra.emptyDir(dirPath)
    .then()
    .catch(err => next(err));

    Jobs.deleteMany({})
    .then((jobs) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({sucess: true})
    }, (err) => next(err))
    .catch((err) => next(err));
});

fileUpload.route('/:jobID')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req, res, next) => {
    Jobs.findById(req.params.jobID)
    .then((job) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(job);
    }, (err) => next(err))
    .catch((err) => next(err));
})

.post(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('Post operation not supported no /jobs/'+ req.params.jobID);
})

.put(cors.corsWithOptions, (req, res, next) => {
    Jobs.findByIdAndUpdate(req.params.jobID,
                           {$set: req.body},
                           {new: true})

    .then((job) => {
        //nlp model(req.body.description, job.resumes)
        res.statusCode = 200,
        res.setHeader('Content-Type', 'application/json'),
        res.json(job);
    }, (err) => next(err))
    .catch((err) => next(err));
})

.delete(cors.corsWithOptions, (req, res, next) => {
    Jobs.findByIdAndRemove(req.params.jobID)
    .then((job) => {
        job.resumes.map((resume) => {
            fsExtra.removeSync(resume.path);
        });
        res.statusCode = 200,
        res.setHeader('Content-Type', 'application/json');
        res.json({sucess: "true"});
    }, (err) => next(err))
    .catch((err) => next(err));
});

fileUpload.route('/:jobID/resumes')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /jobs' + req.params.jobID + '/resumes');
})

.put(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /jobs' + req.params.jobID + '/resumes');
})

.post(cors.corsWithOptions, upload.array('filefield', 10000), (req, res, next) => {
    //nlp_model
    Jobs.findById(req.params.jobID)
    .then((job) => {
        req.files.map((file) => {
            job.resumes = job.resumes.concat({filename: file.filename, path: file.path, percentage: Math.random(), jobId: job._id});
        });

        job.save()
        .then((job) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(job);
        }, (err) => next(err))
        .catch((err) => next(err));
    }, (err) => next(err))
    .catch((err) => next(err));
})

.delete(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /jobs' + req.params.jobID + '/resumes');
})

fileUpload.route('/:jobID/resumes/:resumeID')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req, res, next) => {
    Jobs.findById(req.params.jobID)
    .then((job) => {
        resume = job.resumes.find(cv => cv._id == req.params.resumeID);
        if(resume)
        {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(resume);
        }
        else
        {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.json({sucess: "false", msg: "didn't find this resume"});
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})

.post(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('Post operation not supported no /jobs/'+ req.params.jobID + '/resumes/' + req.params.resumeID);
})

.put(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('Put operation not supported no /jobs/'+ req.params.jobID + '/resumes/' + req.params.resumeID);
})

.delete(cors.corsWithOptions, (req, res, next) => {
    Jobs.findById(req.params.jobID)
    .then((job) => {
        resume = job.resumes.find(cv => cv._id == req.params.resumeID);
        fsExtra.removeSync(resume.path);
        job.resumes.remove(resume);
        job.save()
        .then((job) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(job);
        }, (err) => next(err))
        .catch((err) => next(err));
    })
    .catch((err) => next(err))
});

module.exports = fileUpload;

var fs = require('fs');
var path = require('path');
var async = require('async');


var YearTag = '年';
var MonthTag = '月';
var groupFun = undefined;


start();

function start() {
    if (process.argv.length == 2) {
        groupFun = g_month;
    } else if (process.argv.length == 3) {
        if (process.argv[2] == '-m') {
            groupFun = g_month;
        } else if (process.argv[2] == '-t') {
            groupFun = g_type;
        } else if (process.argv[2] == '-h') {
            console.log('Help:');
            console.log('    -m, group by month (Default)');
            console.log('    -t, group by file type');
        }

    }

    if (groupFun) {
        async.waterfall([
            function(cb) {
                fs.readdir(process.cwd(), function(err, _files) {
                    cb(null, _files);
                })
            },
            function(_files, cb) {
                getStat(_files, cb);
            },
            function(files, stats, cb) {
                groupFun(files, stats, cb);
            },
            function(files, cb) {
                async.each(files, moveFile, function(err) {
                    if (err) {
                        console.log(err)
                    }

                })
            }
        ])
    }

}

function getStat(_files, cb) {
    async.map(_files, fs.stat, function(err, results) {

        cb(null, _files, results);
    });
}


//group by month
function g_month(files, _stats, cb) {
    var f_month = [];
    for (var i = 0; i < _stats.length; i++) {
        f_month.push('20' + (_stats[i].ctime.getYear() - 100) + YearTag + (_stats[i].ctime.getMonth() + 1) + MonthTag);
    }

    async.each(f_month, function(_f, callback) {
        var p = path.join(__dirname, _f);
        fs.exists(p, function(exists) {
            if (!exists) {
                fs.mkdir(p, function() {
                    console.log('mkdir--' + p);
                    callback();
                })
            } else {
                callback();
            }
        })

    }, function(err) {
        if (err) {
            console.log(err);
        } else {
            var tmp = [];
            for (var i = 0; i < files.length; i++) {
                var n = files[i];
                var p = path.join(__dirname, f_month[i]);
                tmp.push({
                    name: n,
                    path: p
                })
            }
            cb(null, tmp);
        }
    })

}

function moveFile(file, cb) {
    if (file.name === 'group.js') {
        cb();
    } else if (/\d+年\d+月/.test(file.name)) {
        cb();
    } else {
        fs.rename(path.join(__dirname, file.name), file.path + '/' + file.name, function(err) {
            cb(err);
        })
    }


}
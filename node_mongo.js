var http = require('http');
var url = require('url');
var fs = require('fs');
var readline = require('readline');
var MongoClient = require('mongodb').MongoClient;
var dburl = "mongodb+srv://tkee:varu58Ce@cluster0.egogg.mongodb.net/stock_market?retryWrites=true&w=majority";


function insertdb()
{
    MongoClient.connect(dburl, function(err, db) {
    if(err) { return console.log("error on connection " + err); }
        console.log("successfully connected to mongodb!");
        var dbo = db.db("stock_market");
        var collection = dbo.collection('companies');
        var firstline = true;
        var line_data, doc;
        var companies_file = readline.createInterface({
            input: fs.createReadStream('companies-1.csv')
        });
        companies_file.on('line', function (line) {
            try {
                if (firstline) {
                    firstline = false;
                    line_data = line;
                } else {
                    line_data = line.split(",");
                    console.log("Inserting | Company: " + line_data[0] + "Stock_Ticker: " + line_data[1]);
                    doc = { "company": line_data[0], "stock_ticker": line_data[1] };
                    collection.insertOne(doc, function (err, res) {
                        if (err) throw err;
                        console.log("new document inserted!");
                    });
                }
            } catch (lineError) {
                console.error(lineError);
            }
        });
    });
}

async function find_input(smethod, inputed)
{
    try {
        await client.connect();
        var dbo = client.db("stock_market");
        var collection = dbo.collection('companies');
        var query;
        if (smethod == "company") {
            query = {company : inputed};
        } else {
            query = {stock_ticker : inputed};
        }
        var output = "";
        const curs = collection.find(query);
        if ((await curs.count()) === 0) {
            console.log("No documents found");
        }
        var c = 0;
        await curs.forEach(function(item) {
            if (c > 0) {
                output += " <br/> ";
            }
            c++;
            output += "Company: " + item.company + ", Stock Ticker: " + item.stock_ticker;
            output += '\n';
        });
    }
    catch(err) {
        console.log("Database error: " + err);
    }
    finally {
        client.close();
    }
    return output;
}

async function insert_find(smethod, inputed, response)
{
    // await insertdb();
    // db.close();
    client = new MongoClient(dburl, { useUnifiedTopology: true});
    var output = await find_input(smethod, inputed);
    response.write(output);
    response.end();

}

http.createServer((request, response) => {
    response.writeHead(200, {'Content-Type': 'text/html'});
    var qobj = url.parse(request.url, true).query;
    var smethod = qobj.smethod;
    var inputed = qobj.inputed;
    response.write("~ Query " + smethod + ": " + inputed + " ~");
    response.write("<br/> <br/>");
    insert_find(smethod, inputed, response);
  }).listen(8080)
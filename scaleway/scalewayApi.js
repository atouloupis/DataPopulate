module.exports.getServersList=getServersList;
module.exports.postNewServer=postNewServer;
module.exports.getServerInfos=getServerInfos;

var keyfile = './key.json';
var jsonfile = require('jsonfile');
var restFull = require('../restFullApi');
var mongo = require('../mongoDb');
var urlMasternode = "mongodb://localhost:27017/masternode";
var mongoClient = require('mongodb').MongoClient;


function getServersList(callback){
jsonfile.readFile(keyfile, function (err, obj) {
	if (err) throw err;
	var options = {
        host: "api.scaleway.com",
        path: "/instance/v1/zones/fr-par-1/servers/",
        method: 'GET',
	    headers: {
            'Content-Type': 'application/json',
			'X-Auth-Token' : obj.scalewayApi.skey
        }
    };

	
	restFull.getRestFull(options,function(err,response){
	callback(response);
	});
});
}

function postNewServer(serverName,tag1,tag2,callback){
	jsonfile.readFile(keyfile, function (err, obj) {
		if (err) throw err;
		var options = {
			host: "api.scaleway.com",
			path: "/instance/v1/zones/fr-par-1/servers/",
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Auth-Token' : obj.scalewayApi.skey
			}
		};
	
		var body = {
			'name':serverName,
			'commercial_type':'DEV1-S',
			'image':'3d6804e0-086e-4a06-8124-7240a657668d',
			'organization':'92098415-46b0-43ef-90ef-727182f4c3b5',
			'tags': [tag1,tag2]
		};	
		restFull.postRestFull(options,body,function(err,res1){
			var serverId=res1.server.id;
			options.path = '/instance/v1/zones/fr-par-1/servers/'+serverId+'/action/';
			body = { 'action':'poweron'};
	 		restFull.postRestFull(options,body,function(err,res2){
				mongoClient.connect(urlMasternode, { useUnifiedTopology: true}, function(err, db) {
					if (err) throw err;
					dbase = db.db("masternode");
					myObj=[{
						serverName:serverName,
						creationDate:res1.server.creation_date,
						serverId:res1.server.id 
					}]
					mongo.insertCollection(dbase,'masternodes', myObj, function(res){
						db.close();
						callback(res);
					});	
				}); 
	 		});
		});
	});
}

function getServerInfos(serverId,callback){
	jsonfile.readFile(keyfile, function (err, obj) {
		if (err) throw err;
		var options = {
			host: "api.scaleway.com",
			path: "/instance/v1/zones/fr-par-1/servers/"+serverId,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-Auth-Token' : obj.scalewayApi.skey
			}
		};
	
		restFull.getRestFull(options,function(err,res1){
			mongoClient.connect(urlMasternode, { useUnifiedTopology: true}, function(err, db) {
				if (err) throw err;
				dbase = db.db("masternode");
				query={serverId:serverId}
				myObj={
					serverName:res1.server.hostname,
					creationDate:res1.server.creation_date,
					serverId:res1.server.id, 
					publicIp:res1.public_ip
				}
				mongo.updateCollection(dbase,'masternodes', qurey, myObj, function(res){
					db.close();
					callback(res);
				});	 
	 		});
		});
	});
}
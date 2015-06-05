var fs = require('fs');
var ejs = require('ejs');
var tumblr = require('tumblr.js');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('abtyuSt6pC-rK8u-mB8sPg');

var csvFile = fs.readFileSync('friend_list.csv','utf8');
var template = fs.readFileSync('email_template.ejs', 'utf-8');

// Authenticate via OAuth
var client = tumblr.createClient({
  consumer_key: '0rO0IZHxaUWjKG7lUcYl6WdEEmwsxXPm8ysEWhvsdf6IwJdpLh',
  consumer_secret: 'zpxRRovswSf0hdewHxysCwPCL0Lah7PK4tpcNc3DbUFWEYeZEv',
  token: 'eIYS43adXVJU6VHew9LNRETcw3CjPrsbYQYE02R5e12kyLtTCA',
  token_secret: 'N7I16wrAyA7HQmFzdSup0UsZQIRjAswz1ttEg4RpTU5z3ufc1W'
});

function csvParse(csv) {
	var data = csv.split('\n'); //split into array
	var header = data.shift().split(','); //separate array into header and friends data arrays

	var arr = [];

	//Loop through friends array
	for (var i = 0; i < data.length; i++) {
		//Split each friend's info into an array and put back into friends array
		data[i] = data[i].split(','); 
		//For each friend create an object
		var obj = {};
		//Loop through each friend's info
		for (var j = 0; j < data[i].length; j++) {
			obj[header[j]] = data[i][j];
		};

		//Insert object into array arr
		arr[i] = obj;
	};
	//Return array containing objects for each friend's data
	return arr;
}

client.posts('techplebian.tumblr.com', function(err, blog){
	if (err) throw err;

	//Create an array of objects, each for a post within the last week
	var latestPosts = blog.posts.filter(function(post) {
		var day = 24*60*60*1000; 
		var postDate = new Date(post.date);
		var nowDate = new Date();
		return (nowDate - postDate)/day <= 7;
	});

	var parsed = csvParse(csvFile);

	//Store personalized templates in an array
	parsed.forEach(function(person) {
		var obj = {
			firstName: person.firstName, 
			numMonthsSinceContact: person.numMonthsSinceContact,
			latestPosts: latestPosts}
		var customizedTemplate = ejs.render(template, obj);
		
		sendEmail(person.firstName, person.emailAddress, 'Justin Kim', 'jkim430@gmail.com', "How's it going?", customizedTemplate);
	});
});

function sendEmail(to_name, to_email, from_name, from_email, subject, message_html) {
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,    
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]    
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        // console.log(message);
        // console.log(result);   
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
}
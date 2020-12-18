//sysex command headers
var mfg = 97; //livid
var pid = 4; //ohm...etc
var ch = 0;
var v1 = 0;
var v2 = 0;
var v3 = 0;
var v4 = 0;
var head = [240, 0, 1, mfg, pid];
var eom = 247;

var outports,inports;
var current_in=0;

var sysexbuffer = new Array();
var issysex = false;

var input_list = [];
var output_list = [];
var paused = false;
var data = null; // DEPRECATED
var output_port = null;
var input_port = null;
top.input_port = null;
top.output_port = null;
/*function doSomething() {

      // callback sets the received data to a global var
	function callBack(d) {
		data = d;
	}
		// start the async
	//myAsynchronousCall(param1, callBack);
	JZZ({sysex:true}).or('Cannot start MIDI engine!')
		.and(function(){ 
			input_list = this.info().inputs;
			output_list = this.info().outputs;
			console.log(this.info().inputs); 
			console.log(this.info().outputs);
		});
}*/

function makemidimenu(){
	console.log("makemidimenu (START)")
	//if (Jazz) {
	//	console.log("- Jazz Plugin Found!");
	//	if (Jazz.isJazz) {
	//		console.log("-- Jazz identification check: ok!");
	//	}
	//	else {
	//		console.log("-- Jazz identification check: failed...");

	//	}
	//}
	//else {
	//	console.log("- Jazz Plugin not Found...");
	//}
	paused = true;
	input_list = [];
	output_list = [];
	//midi_session = JZZ({sysex:true}).or('Cannot start MIDI engine!');
	//code before the pause
    //do what you need here
	//midi_session = JZZ({sysex:true}).or('Cannot start MIDI engine!')
	// engine:['webmidi', 'etc']
	JZZ({sysex:true, engine:['webmidi', 'etc']}).or('Cannot start MIDI engine!')  // !mark
		.and(function(){ 
			input_list = this.info().inputs;
			output_list = this.info().outputs;
			console.log(this.info().inputs); 
			console.log(this.info().outputs);
			//paused = false;
		}).and(function(){
			populatemidimenu();
		});
		console.log("makemidimenu (START)")
	}
function populatemidimenu() {

	console.log("- JZZ: Inputs -> " + input_list);
	console.log("- JZZ: Outputs -> " + output_list);

	//list = JZZ().MidiOutList();
	//log("make midi menu");
	outports=document.getElementById('outports');
	inports=document.getElementById('inports');
	try{
		console.log("Getting MIDI Port lists...");
		var list = output_list; //Jazz.MidiOutList();
		console.log("- Outputs Read");
		list.unshift("--Select a Port--");
		for(var i in list){
			if (i==0) {
				outports[i]=new Option("--Select a Port--", "--Select a Port--",i==0,i==0);
			} else {
				console.log("outport " + list[i].name);
				outports[i]=new Option(list[i].name,list[i].name,i==0,i==0);
				//log("outport "+list[i]);
			}
		}
		document.getElementById('midiout').className=''; //change class to nothing so it's visible
		//if(SPOOF){
			list = [];
			list=input_list;
			//list=Jazz.MidiInList();
			console.log("- Inputs Read");
			list.unshift("--Select a Port--")
			for(var i in list){
				if (i==0) {
					outports[i]=new Option("--Select a Port--", "--Select a Port--",i==0,i==0);
				} else {
					console.log("inport " + list[i].name);
					inports[i]=new Option(list[i].name,list[i].name,i==0,i==0);
					inports[inports.options.length]=new Option(list[i].name,list[i].name,list[i]==0,list[i]==0);
					//log("inport "+list[i]);
				}
			}
			if(SPOOF) document.getElementById('midiin').className=''; //change class to nothing so it's visible
		//}
	}
	catch(err){
		console.log("Error occurred when Getting MIDI Port lists.");
	}
	
	//restricts midi to only the current tab - useful if you have more than one instance open in several tabs
	if(navigator.appName=='Microsoft Internet Explorer'){ 
		document.onfocusin=onFocusIE; 
		document.onfocusout=onBlurIE;
	}else{
		//window.onfocus=connectMidiIn; window.onblur=disconnectMidiIn;
		window.onfocus=refocus; 
		window.onblur=defocus;
	}

}
function defocus(){
	if(!requesting){ //set unique tab once requests are done - it's easy to nav away from window during requests.
		disconnectMidiIn();
	}
}
function refocus(){
	if(!requesting){ //set unique tab once requests are done - it's easy to nav away from window during requests.
		connectMidiIn();
	}
}

//select an out port
function midioutports(theport){
	var outport;
	if(theport){
		outport=theport;
	}else{
		outport=outports.options[outports.selectedIndex].value;
	}
	console.log("port selected: "+outport);
	output_port = JZZ().openMidiOut(outport);
	top.output_port = output_port
	//Jazz.MidiOutOpen(outport);
	//open the inport with the same name. First, make the menu display this port (even though we are hiding it from view right now!):
	var doalert=1;
	for(var i=0;i<inports.length;i++){
		if(inports[i].value==outport) {
			inports[i].selected=1;
			doalert=0;
		}
		//log("inport "+inports.options[inports.selectedIndex].value);
	}
	if(doalert){
		alert_panel("Error: there are not matching MIDI in/out ports on your system! Please check your controller connection and configuration");
	}
	//spoofing is used for testing with no hardware.
	if(!SPOOF){
		input_port = JZZ().openMidiIn(outport);
		top.input_port = input_port;
		top.input_port.connect(midiProc)
		//Jazz.MidiInOpen(outport,function(t,a){ midiProc(a);});
		current_in=outport;
		inselected();
	}	
}

//select an in port
function midiinports(){
	if(SPOOF){
		//log("INPORT");
		input_port = JZZ().openMidiIn(inports.options[inports.selectedIndex].value);
		top.input_port = input_port;
		top.input_port.connect(midiProc)		
		//Jazz.MidiInOpen(inports.options[inports.selectedIndex].value,function(t,a){ midiProc(a);});
		//document.getElementById('midiiohint').className='hidden'; //hide the hint	
		inselected();
	}
}

function inselected(){
	//reformat some of the html:
	$("#midiio").fadeOut(1000);
	$("#midihint").css({visibility : 'hidden'});
	$("#midihint").html(''); //otherwise it leaves space
	$("#midiioscrim").fadeOut(1000);
	$("#left_container").css({'opacity' : 1});
	$("#right_container").css({'opacity' : 1});
	inquire(); //send inquiry to find out what controller is on this port
}
	
function midi_o(){
	
	//if(Jazz.isJazz){
		var arg = Array.prototype.slice.call(arguments, 0);
		var sysid = "...";
		if(arg.length==1) arg=arg[0];
		if(arg[5]){
		  sysid = arg[5];
		}
		console.log("midiout _ ID: "+sysid+" len: "+arg.length+" msg: "+arg);
		//Jazz.MidiOutLong(arg);
		top.output_port.send(arg);
	//}
}

function connectMidiIn(){
	console.log("attempting to connect to MIDI port");
	try{
		input_port = JZZ().openMidiIn(inports.options[inports.selectedIndex].value);
		top.input_port = input_port;
		top.input_port.connect(midiProc)		
		//var str=Jazz.MidiInOpen(current_in,function(t,a){ midiProc(a);});
		var str = input_port.name;
		console.log("connect to selected midi input...");
		//console.log("connect midi: "+str+" current "+current_in);
		for(var i=0;i<inports.length;i++){
			if(inports[i].value==str) inports[i].selected=1;
		}
	}
	catch(err){
		console.log("connect midi in: failed");
	}
}

function disconnectMidiIn(){
	if(inports[0].selected!=1){
		current_in=inports.options[inports.selectedIndex].value;
		console.log("inport: "+current_in);
	}
	try{
		input_port.close();
		//Jazz.MidiInClose(); 
		inports[0].selected=1;
		console.log("discnx "+inports[0].selected);
	}
	catch(err){}
}

var active_element;

function onFocusIE(){
	if(!requesting){ //set unique tab once requests are done - it's easy to nav away from window during requests.
		active_element=document.activeElement;
		connectMidiIn();
	}
}
function onBlurIE(){
	if(!requesting){ //set unique tab once requests are done - it's easy to nav away from window during requests.
		if(active_element!=document.activeElement){ active_element=document.activeElement; return;}
		disconnectMidiIn();
	}
}



//midiout=midiout.concat(head,6,eom);
function midiProc(){
	//function viewmidi is declared in editor.html
	var arg = Array.prototype.slice.call(arguments, 0);
	var lasti = (arg[0].length-1);
	console.log("midi in -- ", arguments[0]);
	//working around a bug in the MIDI plug in where it breaks up long sysex strings: we detect start and end of sysex, and gather it into a buffer.
	if(issysex){
		sysexbuffer = sysexbuffer.concat(arg[0]);
	}
	if(arg[0][0]==240){
		sysexbuffer = new Array();
		sysexbuffer = sysexbuffer.concat(arg[0]);
		issysex = true;
	}
	if(arg[0][lasti]==247){
		issysex = false;
		var CMD=sysexbuffer[5];
		if(CMD != 7){ //7 is only an issue if we are spoofing a controller over IAC for testing. 7 is the request ID, so it should never come into this app anyway.
			var message = CMD+": "+cmdfriendly[CMD];
			if(CMD==0 && sysexbuffer.length==17){
				message = "rx: "+sysexbuffer;
			}
			var ohmblockfilter = (CMD==9 && !requesting); //if we aren't requesting, ignore incoming command number 9. For whatever reason, the ohm&block confirm an rx of cmd 9 with a tx of cmd9. Bleh.
			if(!ohmblockfilter){
				procSysex(sysexbuffer); //in uitocontroller
			}
		}		
	}else if(!issysex){
		highlight(arg[0][0],arg[0][1],arg[0][2]);
		viewmidi( midiString(arg[0]) ); 
	}
}

//-----------MIDI of the non-sysex variety-------------
var pvsID=-1;
function highlight(){
    var key,value;
	var a = Array.prototype.slice.call(arguments, 0);
	if(a.length==1){
		a = Array.prototype.slice.call(a[0], 0);
	}
    if(a.length == 3){
        key = a[0] | (a[1] << 8);
        value = a[2];
    }else{
        key = a[0];
        value = a[1];
    }
    //miditoID[key] is defined in fcn dumpmap() in uitocontroller.js
	//log("match "+a[0]+" "+a[1]+" "+key+" "+miditoID[key]);
	if(miditoID[key]){
		var id=miditoID[key][0];
		var type=miditoID[key][1];
		if(id!=pvsID){
			//paint the UI with a yellow highlight. ending url with ?mode=warn&btn=5 will blink btn_5 with warn color:
			selctl(pid,type+"_"+id)
		}
		pvsID=id; //for change filter
	}
}

function midiString(){
	var a,b,c;
	var arg = Array.prototype.slice.call(arguments, 0);
	if(arg.length==1){
		arg = Array.prototype.slice.call(arg[0], 0);
	}
	a=arg[0];
	b=arg[1];
	c=arg[2];
	var cmd=Math.floor(a>>4);
	var note=b;
	var notename=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'][note%12]+Math.floor(note/12);
	var channel = 1+(a%16);
	//a=a.toString(16);
	//b=(b<16?'0':'')+b.toString(16);
	//c=(c<16?'0':'')+c.toString(16);
	//var str=a+" "+b+" "+c+" | ";
	var str = "CH "+channel+" | ";
	if(cmd==8){
		str+="NoteOff ("+notename+") "+note+" "+c;
	}
	else if(cmd==9){
		str+="Note ("+notename+") "+note+" "+c;
	}
	else if(cmd==10){
		str+="Polytouch "+note+" ("+notename+")";
	}
	else if(cmd==11){
		str+="CC "+b+" "+c;
	}
	else if(cmd==12){
		str+="Program "+b;
	}
	else if(cmd==13){
		str+="Aftertouch";
	}
	else if(cmd==14){
		str+="Pitch Wheel";
	}
	return str;
}



function testmidiio(){
	console.log("midiio.js is here!");
}
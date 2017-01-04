Getting started
===============

So, we're using a few build tools in this project.  I'm still learing these myself.

First things first, **download node.js**.  Either apt-get install it or download at https://nodejs.org/.


I've told git to ignore all the 3rd party libs and tools.  We each install our own copies (not a big deal).

In terminal (or command line), navigate to the client/ directory.

To download node modules (locally), run:
```
node install
```


You will also have to download js and css libs for the frontend.  Run the custom script:
```
node run bower
```

Alternately, if you have bower installed run:
```
bower install
```


For Angular to work properly, you need to run it on a server.  I have a mock backend set up.  Run with:
```
node run start
```

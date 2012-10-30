A visualization of data from various Feats in the game [Glitch](1), scraped 
using node.js and visualized using d3.js. The latest version should be 
available at http://resources.grelca.com/feats/. 

## How it works 

The entire site is static. `index.html` contains a skeleton template from 
which data will be filled into. `assets/page.js` contains the front-end 
code which does most of the magic. It loads the `data` and `metadata` file for
each feat from the `data` folder using Ajax and processes them into the graph
which is rendered on the client side using d3.js

## To build

You'll need node.js, which you can obtain from http://nodejs.org/. In addition, 
the following modules are used: 

 - Jade 
 - Request 
 - Cheerio 

All three of which can be installed using `npm`. Once you're done, 
simply run

    node build.js 
    
This should create index.html. 

## To scrape new feats 

Run 

    node data.js <URL to feat> 
    
For instance, 

    node data.js http://www.glitch.com/feats/sparklas-shine/

This will create a new folder under `data`, inside which there is a 
`data` file, which contains a sorted descending list of numbers of contribution
from each contributor, and `metadata`, which is a JSON file containing 
attributes of the feat such as total contributions, rewards and goals. 

 [1]: http://glitch.com/

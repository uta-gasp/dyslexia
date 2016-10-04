#NOKIA calibration
Calibration point presentation for NOKIA/2015 project

##Config
*   `config` entry in "package.json": it stores the values shared between modules
    -   accessible in the back-end scripts using `config = require('helpers/config')` (eg., `var port = config.web.port;`)
    -   accessible in the front-end scripts using injection of the form `[[[NAME]]]` (eg., `var port = [[[web.port]]];`)
*   the files in `config/` folder contain module, app or tool -dependent config files:
    -   `shim.js`: browserify shim configuration (not used in the current version)

##Install and run
Clone the package using git:

    git clone https://github.com/lexasss/nokia-calib.git

Install depenencies:

    npm install

Build the package:

    grunt

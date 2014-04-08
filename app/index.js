'use strict';
var util = require('util');
var path = require('path');
var spawn = require('child_process').spawn;
var yeoman = require('yeoman-generator');
var chalk = require('chalk');


var WebappAssembleGenerator = module.exports = function WebappAssembleGenerator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  // setup the test-framework property, Gruntfile template will need this
  this.testFramework = options['test-framework'] || 'mocha';
  this.coffee = options.coffee;

  // for hooks to resolve on mocha by default
  options['test-framework'] = this.testFramework;

  // resolved to mocha by default (could be switched to jasmine for instance)
  this.hookFor('test-framework', {
    as: 'app',
    options: {
      options: {
        'skip-message': options['skip-install-message'],
        'skip-install': options['skip-install']
      }
    }
  });

  this.options = options;

  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
};

util.inherits(WebappAssembleGenerator, yeoman.generators.Base);

WebappAssembleGenerator.prototype.askFor = function askFor() {
  var cb = this.async();

  // welcome message
  if (!this.options['skip-welcome-message']) {
    console.log(this.yeoman);
    console.log(chalk.magenta('Out of the box I include HTML5 Boilerplate, jQuery, and a Gruntfile.js to build your app.'));
  }

  var prompts = [{
    type: 'checkbox',
    name: 'features',
    message: 'What more would you like?',
    choices: [{
      name: 'Bootstrap',
      value: 'includeBootstrap',
      checked: true
    },{
      name: 'Sass',
      value: 'includeSass',
      checked: false
    },{
      name: 'Modernizr',
      value: 'includeModernizr',
      checked: false
    },{
      name: 'Font Awesome',
      value: 'includeFontAwesome',
      checked: true
    }]
  }, {
    when: function (answers) {
      return answers.features.indexOf('includeSass') !== -1;
    },
    type: 'confirm',
    name: 'libsass',
    value: 'includeLibSass',
    message: 'Would you like to use libsass? Read up more at \n' + chalk.green('https://github.com/andrew/node-sass#reporting-sass-compilation-and-syntax-issues'),
    default: false
  }];

  this.prompt(prompts, function (answers) {
    var features = answers.features;

    function hasFeature(feat) { return features.indexOf(feat) !== -1; }
    // manually deal with the response, get back and store the results.
    // we change a bit this way of doing to automatically do this in the self.prompt() method.
    this.includeSass = hasFeature('includeSass');
    this.includeBootstrap = hasFeature('includeBootstrap');
    this.includeModernizr = hasFeature('includeModernizr');
    this.includeFontAwesome = hasFeature('includeFontAwesome');


    this.includeLibSass = answers.libsass;
    this.includeRubySass = !(answers.libsass);

    cb();
  }.bind(this));
};


WebappAssembleGenerator.prototype.writeAssemble = function gruntfile() {
  this.defaultLayout = this.readFileAsString(path.join(this.sourceRoot()+'/assemble/layouts/', 'default.hbs'));
  this.defaultLayout = this.engine(this.defaultLayout, this);

  // wire Bootstrap plugins
  if (this.includeBootstrap) {
    var bs = '../bower_components/bootstrap' + (this.includeCompass ? '-sass-official/vendor/assets/javascripts/bootstrap/' : '/js/');
    this.defaultLayout = this.appendScripts(this.defaultLayout, 'scripts/plugins.js', [
      bs + 'affix.js',
      bs + 'alert.js',
      bs + 'dropdown.js',
      bs + 'tooltip.js',
      bs + 'modal.js',
      bs + 'transition.js',
      bs + 'button.js',
      bs + 'popover.js',
      bs + 'carousel.js',
      bs + 'scrollspy.js',
      bs + 'collapse.js',
      bs + 'tab.js'
    ]);
  }
};

WebappAssembleGenerator.prototype.writeAssemblePage = function gruntfile() {
  this.pageIndex = this.readFileAsString(path.join(this.sourceRoot()+'/assemble/pages/', 'index.hbs'));
  this.pageIndex = this.engine(this.pageIndex, this);

  this.partialNav = this.readFileAsString(path.join(this.sourceRoot()+'/assemble/partials/', 'nav.hbs'));
  this.partialNav = this.engine(this.partialNav, this);

  this.partialFooter = this.readFileAsString(path.join(this.sourceRoot()+'/assemble/partials/', 'footer.hbs'));
  this.partialFooter = this.engine(this.partialFooter, this);
};



WebappAssembleGenerator.prototype.gruntfile = function gruntfile() {
  this.template('Gruntfile.js');
};

WebappAssembleGenerator.prototype.packageJSON = function packageJSON() {
  this.template('_package.json', 'package.json');
};

WebappAssembleGenerator.prototype.git = function git() {
  this.copy('gitignore', '.gitignore');
  this.copy('gitattributes', '.gitattributes');
};

WebappAssembleGenerator.prototype.bower = function bower() {
  this.copy('_bower.json', 'bower.json');
};

WebappAssembleGenerator.prototype.jshint = function jshint() {
  this.copy('jshintrc', '.jshintrc');
};

WebappAssembleGenerator.prototype.editorConfig = function editorConfig() {
  this.copy('editorconfig', '.editorconfig');
};

WebappAssembleGenerator.prototype.h5bp = function h5bp() {
  this.copy('favicon.ico', 'app/favicon.ico');
  this.copy('robots.txt', 'app/robots.txt');
  this.copy('htaccess', 'app/.htaccess');
};

WebappAssembleGenerator.prototype.mainStylesheet = function mainStylesheet() {
  var css = 'main.' + (this.includeSass ? 's' : '') + 'css';
  this.copy(css, 'app/styles/' + css);
};

WebappAssembleGenerator.prototype.app = function app() {
  this.mkdir('app');
  this.mkdir('app/scripts');
  this.mkdir('app/styles');
  this.mkdir('app/images');
  this.mkdir('app/template');
  this.mkdir('app/template/layouts');
  this.mkdir('app/template/pages');
  this.mkdir('app/template/partials');
  
  this.write('app/template/layouts/default.hbs', this.defaultLayout);
  this.write('app/template/pages/index.hbs', this.pageIndex);
  this.write('app/template/partials/nav.hbs', this.partialNav);
  this.write('app/template/partials/footer.hbs', this.partialFooter);

  if (this.coffee) {
    this.write(
      'app/scripts/main.coffee',
      'console.log "\'Allo from CoffeeScript!"'
    );
  }
  else {
    this.write('app/scripts/main.js', 'console.log(\'\\\'Allo \\\'Allo!\');');
  }
};

WebappAssembleGenerator.prototype.install = function () {
  if (this.options['skip-install']) {
    return;
  }

  var done = this.async();
  this.installDependencies({
    skipMessage: this.options['skip-install-message'],
    skipInstall: this.options['skip-install'],
    callback: done
  });
};
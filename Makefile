#
# -*- Prerequisites -*-
#

# the fact that 'I am Node.js' is unquoted here looks wrong to me but it
# CAN'T be quoted, I tried. Apparently in GNU Makefiles, in the paren+comma
# syntax for conditionals, quotes are literal; and because the $(shell...)
# call has parentheses and single and double quotes, the quoted syntaxes
# don't work (I tried), we HAVE to use the paren+comma syntax
ifneq ($(shell node -e 'console.log("I am Node.js")'), I am Node.js)
  ifeq ($(shell nodejs -e 'console.log("I am Node.js")' 2>/dev/null), I am Node.js)
    $(error You have /usr/bin/nodejs but no /usr/bin/node, please 'sudo apt-get install nodejs-legacy' (see http://stackoverflow.com/a/21171188/362030 ))
  endif

  $(error Please install Node.js: https://nodejs.org/ )
endif

#
# -*- Configuration -*-
#

# inputs
SRC_DIR = ./src
TEST_DIR = ./test
INTRO = $(TEST_DIR)/intro.js
OUTRO = $(TEST_DIR)/outro.js

BASE_SOURCES = \
  $(SRC_DIR)/utils.ts \
  $(SRC_DIR)/dom.ts \
  $(SRC_DIR)/unicode.ts \
  $(SRC_DIR)/browser.ts \
  $(SRC_DIR)/animate.ts \
  $(SRC_DIR)/services/aria.ts \
  $(SRC_DIR)/domFragment.ts \
  $(SRC_DIR)/tree.ts \
  $(SRC_DIR)/cursor.ts \
  $(SRC_DIR)/controller.ts \
  $(SRC_DIR)/publicapi.ts \
  $(SRC_DIR)/services/parser.util.ts \
  $(SRC_DIR)/services/saneKeyboardEvents.util.ts \
  $(SRC_DIR)/services/exportText.ts \
  $(SRC_DIR)/services/focusBlur.ts \
  $(SRC_DIR)/services/keystroke.ts \
  $(SRC_DIR)/services/latex.ts \
  $(SRC_DIR)/services/mouse.ts \
  $(SRC_DIR)/services/scrollHoriz.ts \
  $(SRC_DIR)/services/textarea.ts

SOURCES_BASIC = \
  $(BASE_SOURCES) \
  $(SRC_DIR)/commands/math.ts \
  $(SRC_DIR)/commands/math/advancedSymbols.ts \
  $(SRC_DIR)/commands/math/basicSymbols.ts \
  $(SRC_DIR)/commands/math/commands.ts

SOURCES_FULL = \
  $(SOURCES_BASIC) \
  $(SRC_DIR)/commands/text.ts \
  $(SRC_DIR)/commands/math/commands.ts \
  $(SRC_DIR)/commands/math/LatexCommandInput.ts

CSS_DIR = $(SRC_DIR)/css
CSS_MAIN = $(CSS_DIR)/main.less
CSS_SOURCES = $(shell find $(CSS_DIR) -name '*.less')

FONT_SOURCE = $(SRC_DIR)/fonts
FONT_TARGET = $(BUILD_DIR)/fonts

BUILD_TYPES	= $(BUILD_DIR)/mathquill.d.ts
TYPES_SOURCE = $(SRC_DIR)/mathquill.d.ts

TEST_SUPPORT = ./test/support/assert.ts ./test/support/trigger-event.ts ./test/support/jquery-stub.ts
UNIT_TESTS = ./test/unit/*.test.js ./test/unit/*.test.ts

# outputs
VERSION ?= $(shell node -e "console.log(require('./package.json').version)")

BUILD_DIR = ./build
BUILD_JS = $(BUILD_DIR)/mathquill.js
BASIC_JS = $(BUILD_DIR)/mathquill-basic.js
BUILD_CSS = $(BUILD_DIR)/mathquill.css
BASIC_CSS = $(BUILD_DIR)/mathquill-basic.css
BUILD_TEST = $(BUILD_DIR)/mathquill.test.js
UGLY_JS = $(BUILD_DIR)/mathquill.min.js
UGLY_BASIC_JS = $(BUILD_DIR)/mathquill-basic.min.js

# programs and flags
UGLIFY ?= ./node_modules/.bin/uglifyjs
UGLIFY_OPTS ?= --mangle --compress hoist_vars=true --comments

LESSC ?= ./node_modules/.bin/lessc
LESS_OPTS ?=
ifdef OMIT_FONT_FACE
  LESS_OPTS += --modify-var="omit-font-face=true"
endif

# Empty target files whose Last Modified timestamps are used to record when
# something like `npm install` last happened (which, for example, would then be
# compared with its dependency, package.json, so if package.json has been
# modified since the last `npm install`, Make will `npm install` again).
# http://www.gnu.org/software/make/manual/html_node/Empty-Targets.html#Empty-Targets
NODE_MODULES_INSTALLED = ./node_modules/.installed--used_by_Makefile
BUILD_DIR_EXISTS = $(BUILD_DIR)/.exists--used_by_Makefile

# environment constants

#
# -*- Build tasks -*-
#

.PHONY: all basic dev js uglify css font clean setup-gitconfig prettify-all
all: font css uglify types
basic: $(UGLY_BASIC_JS) $(BASIC_CSS)
unminified_basic: $(BASIC_JS) $(BASIC_CSS)
# dev is like all, but without minification
dev: font css js
js: $(BUILD_JS)
uglify: $(UGLY_JS)
css: $(BUILD_CSS)
font: $(FONT_TARGET)
types: $(BUILD_TYPES)
clean:
	rm -rf $(BUILD_DIR)
# This adds an entry to your local .git/config file that looks like this:
# [include]
# 	path = ../.gitconfig
# that tells git to include the additional configuration specified inside the .gitconfig file that's checked in here.
setup-gitconfig:
	@git config --local include.path ../.gitconfig
prettify-all:
	npx prettier --write '**/*.{ts,js,css,html}'

RM_INSRC_TESTS = sed '/\/\/ rm_below_makefile/,/\/\/ rm_above_makefile/d'

# add contents of source-code-form.txt to top of compiled file
$(BUILD_JS): $(SOURCES_FULL) $(BUILD_DIR_EXISTS)
	cat $^ | $(RM_INSRC_TESTS) | ./script/escape-non-ascii | ./script/tsc-emit-only > $@
	perl -pi -e s/mq-/$(MQ_CLASS_PREFIX)mq-/g $@
	echo 'module.exports = MathQuill;' >> $@
	perl -pi -e 'print `cat source-code-form.txt` if $$. == 1' $@
	perl -pi -e s/{VERSION}/v$(VERSION)/ $@

$(UGLY_JS): $(BUILD_JS) $(NODE_MODULES_INSTALLED)
	$(UGLIFY) $(UGLIFY_OPTS) < $< > $@

# used for testing
$(BASIC_JS): $(INTRO) $(SOURCES_BASIC) $(OUTRO) $(BUILD_DIR_EXISTS)
	cat $^ | ./script/escape-non-ascii | ./script/tsc-emit-only > $@
	perl -pi -e s/mq-/$(MQ_CLASS_PREFIX)mq-/g $@
	perl -pi -e s/{VERSION}/v$(VERSION)/ $@

$(UGLY_BASIC_JS): $(BASIC_JS) $(NODE_MODULES_INSTALLED)
	$(UGLIFY) $(UGLIFY_OPTS) < $< > $@

$(BUILD_CSS): $(CSS_SOURCES) $(NODE_MODULES_INSTALLED) $(BUILD_DIR_EXISTS)
	$(LESSC) $(LESS_OPTS) $(CSS_MAIN) > $@
	perl -pi -e s/mq-/$(MQ_CLASS_PREFIX)mq-/g $@
	perl -pi -e 'print `cat source-code-form.txt` if $$. == 1' $@
	perl -pi -e s/{VERSION}/v$(VERSION)/ $@

$(BASIC_CSS): $(CSS_SOURCES) $(NODE_MODULES_INSTALLED) $(BUILD_DIR_EXISTS)
	$(LESSC) --modify-var="basic=true" $(LESS_OPTS) $(CSS_MAIN) > $@
	perl -pi -e s/mq-/$(MQ_CLASS_PREFIX)mq-/g $@
	perl -pi -e s/{VERSION}/v$(VERSION)/ $@

$(NODE_MODULES_INSTALLED): package.json
	test -e $(NODE_MODULES_INSTALLED) || rm -rf ./node_modules/ # robust against previous botched npm install
	NODE_ENV=development npm ci
	touch $(NODE_MODULES_INSTALLED)

$(BUILD_DIR_EXISTS):
	mkdir -p $(BUILD_DIR)
	touch $(BUILD_DIR_EXISTS)

$(FONT_TARGET): $(FONT_SOURCE) $(BUILD_DIR_EXISTS)
	rm -rf $@
	cp -r $< $@

# copy file and add "export = MathQuill" to the beginning
$(BUILD_TYPES): $(TYPES_SOURCE) $(BUILD_DIR_EXISTS)
	cp $< $@
	perl -pi -e 'print "export = MathQuill;\n" if $$. == 1' $@
	perl -pi -e 'print `cat source-code-form.txt` if $$. == 1' $@
	perl -pi -e s/{VERSION}/v$(VERSION)/ $@

#
# -*- Test tasks -*-
#
.PHONY:
lint:
	npx tsc --noEmit
  # Make sure that the public, standalone type definitions do not depend on any internal sources.
	npx tsc --noEmit -p test/tsconfig.public-types-test.json

.PHONY: test server benchmark
server:
	node script/test_server.js
test: dev $(BUILD_TEST) $(BASIC_JS) $(BASIC_CSS)
	@echo
	@echo "** now open test/{unit,visual}.html in your browser to run the {unit,visual} tests. **"
	@open test/unit.html
benchmark: dev $(BUILD_TEST) $(BASIC_JS) $(BASIC_CSS)
	@echo
	@echo "** now open benchmark/{render,select,update}.html in your browser. **"

$(BUILD_TEST): $(INTRO) $(SOURCES_FULL) $(TEST_SUPPORT) $(UNIT_TESTS) $(OUTRO) $(BUILD_DIR_EXISTS)
	cat $^ | ./script/tsc-emit-only > $@
	perl -pi -e s/{VERSION}/v$(VERSION)/ $@

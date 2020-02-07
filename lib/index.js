var _ = require("lodash");

module.exports = function(nunjucks) {
    return function I18nExtension(options) {
        this.tags = ['i18n'];

        options = _.defaults(options || {}, {
            translations: {},
            locale: "__locale__",
            alternativeFilterNames: null,
            textIdLowerCase: false
        });

        var translate = function(defaultText, textId, kwargs) {
            kwargs = kwargs || {};

            // Convert text id to lower case
            if (options.textIdLowerCase) {
                textId = textId.toLowerCase()
            }

            var locale = this.ctx[options.locale] || options.env.getGlobal(options.locale);
            var text = (options.translations[locale] || {})[textId]  || defaultText;

            // Replace arguments
            _.each(kwargs, function(value, arg) {
                text = text.replace(arg, value);
            });

            return text;
        }

        this.parse = function(parser, nodes, lexer) {
            var tok = parser.nextToken();
            var args = parser.parseSignature(null, true);
            parser.advanceAfterBlockEnd(tok.value);
            var body = parser.parseUntilBlocks('endi18n');
            parser.advanceAfterBlockEnd();
            return new nodes.CallExtension(this, 'run', args, [body]);
        };

        this.run = function(context, textId, kwargs) {
            kwargs = kwargs || {};
            body = _.last(arguments);

            var text = translate.call(context, body(), textId, kwargs);
            return new nunjucks.runtime.SafeString(text);
        };

        // Add filter
        options.env.addFilter("i18n", translate);
        // Add filter under alternative names, if provided
        if (options.alternativeFilterNames && options.alternativeFilterNames.length) {
            options.alternativeFilterNames.forEach(function(alternativeFilterName) {
                options.env.addFilter(alternativeFilterName, translate)
            })
        }
    };
};

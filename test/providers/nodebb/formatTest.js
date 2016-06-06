'use strict';

const chai = require('chai');

chai.use(require('chai-as-promised'));
chai.use(require('chai-string'));
chai.should();


const testModule = require('../../../providers/nodebb/format');
describe('providers/nodebb/format', () => {
    describe('exports', () => {
        const fns = ['urlForPost', 'urlForTopic', 'quoteText', 'link', 'image', 'spoiler',
            'italic', 'bold', 'bolditalic', 'header1', 'header2', 'header3', 'header4',
            'header5', 'header6'
        ];
        fns.forEach((fn) => {
            it(`should export '${fn}()'`, () => {
                chai.expect(testModule[fn]).to.be.a('function');
            });
        });
        it('should only have expected functions', () => {
            testModule.should.have.all.keys(fns);
        });
    });
    describe('urlForPost()', () => {
        it('should return expected URL', () => {
            const expected = '/post/honey-badger';
            testModule.urlForPost('honey-badger').should.equal(expected);
        });
        describe('resists bad input', () => {
            [
                undefined, null, false, '', 0, NaN, []
            ].forEach((input) => {
                const expected = '';
                it(`should provide sensible output for input: ${input}`, () => {
                    const actual = testModule.urlForPost(input);
                    actual.should.equal(expected);
                });
            });
            [
                ['Summer Glau', '/post/Summer Glau'],
                [4, '/post/4'],
                [3.1415, '/post/3.1415'],
                [true, '/post/true'],
                [{}, '/post/[object Object]']
            ].forEach((cfg) => {
                const input = cfg[0],
                    expected = cfg[1];
                it(`should provide sensible output for input: ${input}`, () => {
                    const actual = testModule.urlForPost(input);
                    actual.should.equal(expected);
                });
            });
        });
    });
    describe('urlForTopic()', () => {
        it('should return expected URL for bare topic', () => {
            const expected = '/topic/1234';
            testModule.urlForTopic(1234).should.equal(expected);
        });
        it('should return expected URL for topic/postIndex', () => {
            const expected = '/topic/1234/topic/5678';
            testModule.urlForTopic(1234, 5678).should.equal(expected);
        });
        it('should return expected URL for topic/slug', () => {
            const expected = '/topic/1234/honey-badger';
            testModule.urlForTopic(1234, 'honey-badger').should.equal(expected);
        });
        it('should return expected URL for topic/slug/index', () => {
            const expected = '/topic/1234/honey-badger/5678';
            testModule.urlForTopic(1234, 'honey-badger', 5678).should.equal(expected);
        });
        describe('resists bad input', () => {
            describe('`topicId`', () => {
                [
                    undefined, null, false, '', 0, NaN, []
                ].forEach((input) => {
                    const expected = '';
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.urlForTopic(input);
                        actual.should.equal(expected);
                    });
                });
                [
                    ['Summer Glau', '/topic/Summer Glau'],
                    [4, '/topic/4'],
                    [3.1415, '/topic/3.1415'],
                    [true, '/topic/true'],
                    [{}, '/topic/[object Object]']
                ].forEach((cfg) => {
                    const input = cfg[0],
                        expected = cfg[1];
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.urlForTopic(input);
                        actual.should.equal(expected);
                    });
                });
            });
            describe('`topicSlug`', () => {
                [
                    undefined, null, false, '', []
                ].forEach((input) => {
                    const expected = '/topic/8472';
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.urlForTopic(8472, input);
                        actual.should.equal(expected);
                    });
                });
                [
                    [0, '/topic/8472/topic'],
                    [NaN, '/topic/8472/topic'],
                    ['Summer Glau', '/topic/8472/Summer Glau'],
                    [4, '/topic/8472/topic/4'],
                    [3.1415, '/topic/8472/topic/3.1415'],
                    [true, '/topic/8472/true'],
                    [{}, '/topic/8472/[object Object]']
                ].forEach((cfg) => {
                    const input = cfg[0],
                        expected = cfg[1];
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.urlForTopic(8472, input);
                        actual.should.equal(expected);
                    });
                });
            });
            describe('`postIndex`', () => {
                [
                    undefined, null, false, '', 0, NaN, []
                ].forEach((input) => {
                    const expected = '/topic/8472/foobar';
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.urlForTopic(8472, 'foobar', input);
                        actual.should.equal(expected);
                    });
                });
                [
                    ['Summer Glau', '/topic/8472/foobar/Summer Glau'],
                    [4, '/topic/8472/foobar/4'],
                    [3.1415, '/topic/8472/foobar/3.1415'],
                    [true, '/topic/8472/foobar/true'],
                    [{}, '/topic/8472/foobar/[object Object]']
                ].forEach((cfg) => {
                    const input = cfg[0],
                        expected = cfg[1];
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.urlForTopic(8472, 'foobar', input);
                        actual.should.equal(expected);
                    });
                });
            });
        });
    });
    describe('quoteText()', () => {
        it('should quote text as expected', () => {
            const input = 'a\n\n\tb\n \t c';
            const expected = '> a\n> \n> \tb\n>  \t c';
            testModule.quoteText(input).should.equal(expected);
        });
        it('should include bare attribution', () => {
            const username = `User${Math.random()}`;
            const expected = `@${username} said:\n`;
            testModule.quoteText('foo', username).should.startWith(expected);
        });
        it('should include linked attribution', () => {
            const username = `User${Math.random()}`;
            const link = '/URL${Math.random()}';
            const expected = `@${username} [said](${link}):\n`;
            testModule.quoteText('foo', username, link).should.startWith(expected);
        });
        it('should include titled attribution', () => {
            const username = `User${Math.random()}`;
            const link = '/URL${Math.random()}';
            const title = `thread${Math.random()}`;
            const expected = `@${username} said in [${title}](${link}):\n`;
            testModule.quoteText('foo', username, link, title).should.startWith(expected);
        });
        describe('resists bad input', () => {
            describe('`text`', () => {
                [
                    undefined, null, false, '', 0, NaN, []
                ].forEach((input) => {
                    const expected = '';
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.quoteText(input);
                        actual.should.equal(expected);
                    });
                });
                [
                    ['Summer Glau', '> Summer Glau'],
                    [4, '> 4'],
                    [3.1415, '> 3.1415'],
                    [true, '> true'],
                    [{}, '> [object Object]']
                ].forEach((cfg) => {
                    const input = cfg[0],
                        expected = cfg[1];
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.quoteText(input);
                        actual.should.equal(expected);
                    });
                });
            });
            describe('`quotedUser`', () => {
                [
                    undefined, null, false, '', 0, NaN, []
                ].forEach((input) => {
                    const expected = '> foobar';
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.quoteText('foobar', input);
                        actual.should.equal(expected);
                    });
                });
                [
                    ['Summer Glau', '@Summer Glau said:\n> foobar'],
                    [4, '@4 said:\n> foobar'],
                    [3.1415, '@3.1415 said:\n> foobar'],
                    [true, '@true said:\n> foobar'],
                    [{}, '@[object Object] said:\n> foobar']
                ].forEach((cfg) => {
                    const input = cfg[0],
                        expected = cfg[1];
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.quoteText('foobar', input);
                        actual.should.equal(expected);
                    });
                });
            });
            describe('`contextURL`', () => {
                [
                    undefined, null, false, '', 0, NaN, []
                ].forEach((input) => {
                    const expected = '@fred said:\n> foobar';
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.quoteText('foobar', 'fred', input);
                        actual.should.equal(expected);
                    });
                });
                [
                    ['Summer Glau', '@fred [said](Summer Glau):\n> foobar'],
                    [4, '@fred [said](4):\n> foobar'],
                    [3.1415, '@fred [said](3.1415):\n> foobar'],
                    [true, '@fred [said](true):\n> foobar'],
                    [{}, '@fred [said]([object Object]):\n> foobar']
                ].forEach((cfg) => {
                    const input = cfg[0],
                        expected = cfg[1];
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.quoteText('foobar', 'fred', input);
                        actual.should.equal(expected);
                    });
                });
            });
            describe('`contextTitle`', () => {
                [
                    undefined, null, false, '', 0, NaN, []
                ].forEach((input) => {
                    const expected = '@fred [said](/var/nginx):\n> foobar';
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.quoteText('foobar', 'fred', '/var/nginx', input);
                        actual.should.equal(expected);
                    });
                });
                [
                    ['Summer Glau', '@fred said in [Summer Glau](/var/nginx):\n> foobar'],
                    [4, '@fred said in [4](/var/nginx):\n> foobar'],
                    [3.1415, '@fred said in [3.1415](/var/nginx):\n> foobar'],
                    [true, '@fred said in [true](/var/nginx):\n> foobar'],
                    [{}, '@fred said in [[object Object]](/var/nginx):\n> foobar']
                ].forEach((cfg) => {
                    const input = cfg[0],
                        expected = cfg[1];
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.quoteText('foobar', 'fred', '/var/nginx', input);
                        actual.should.equal(expected);
                    });
                });
            });
        });
    });
    describe('headers', () => {
        [
            ['H1', 'header1', '# test text'],
            ['H2', 'header2', '## test text'],
            ['H3', 'header3', '### test text'],
            ['H4', 'header4', '#### test text'],
            ['H5', 'header5', '##### test text'],
            ['H6', 'header6', '###### test text']
        ].forEach((cfg) => {
            it(`should generate a ${cfg[0]} header`, () => {
                testModule[cfg[1]]('test text').should.equal(cfg[2]);
            });
        });
        [
            ['H1', 'header1', '# '],
            ['H2', 'header2', '## '],
            ['H3', 'header3', '### '],
            ['H4', 'header4', '#### '],
            ['H5', 'header5', '##### '],
            ['H6', 'header6', '###### ']
        ].forEach((cfg) => {
            const method = cfg[1],
                title = cfg[0],
                prefix = cfg[2];
            describe(`${title}: resists bad input`, () => {
                [
                    undefined, null, false, '', 0, NaN, []
                ].forEach((input) => {
                    const expected = '';
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule[method](input);
                        actual.should.equal(expected);
                    });
                });
                [
                    ['Summer Glau', 'Summer Glau'],
                    [4, '4'],
                    [3.1415, '3.1415'],
                    [true, 'true'],
                    [{}, '[object Object]']
                ].forEach((testcfg) => {
                    const input = testcfg[0],
                        expected = testcfg[1];
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule[method](input);
                        actual.should.equal(prefix + expected);
                    });
                });
            });
        });
    });
    describe('emphasis', () => {
        [
            ['italic', '*test text*'],
            ['bold', '**test text**'],
            ['bolditalic', '***test text***']
        ].forEach((cfg) => {
            it(`should generate ${cfg[0]} text`, () => {
                testModule[cfg[0]]('test text').should.equal(cfg[1]);
            });
            it(`should remove leading whitespace for ${cfg[0]} text`, () => {
                testModule[cfg[0]](' \t test text').should.equal(cfg[1]);
            });
            it(`should remove trailing whitespace for ${cfg[0]} text`, () => {
                testModule[cfg[0]]('test text \t\t ').should.equal(cfg[1]);
            });
            it(`should remove leading and trailing whitespace for ${cfg[0]} text`, () => {
                testModule[cfg[0]](' \t test text \t  \t\t ').should.equal(cfg[1]);
            });
        });
        describe('resists bad input', () => {
            [
                undefined, null, false, '', 0, NaN, []
            ].forEach((input) => {
                const expected = '';
                it(`bold: should provide sensible output for input: ${input}`, () => {
                    const actual = testModule.bold(input);
                    actual.should.equal(expected);
                });
                it(`italic: should provide sensible output for input: ${input}`, () => {
                    const actual = testModule.italic(input);
                    actual.should.equal(expected);
                });
                it(`bolditalic: should provide sensible output for input: ${input}`, () => {
                    const actual = testModule.bolditalic(input);
                    actual.should.equal(expected);
                });
            });
            [
                ['Summer Glau', 'Summer Glau'],
                [4, '4'],
                [3.1415, '3.1415'],
                [true, 'true'],
                [{}, '[object Object]']
            ].forEach((testcfg) => {
                const input = testcfg[0],
                    expected = testcfg[1];
                it(`bold: should provide sensible output for input: ${input}`, () => {
                    const actual = testModule.bold(input);
                    actual.should.equal(`**${expected}**`);
                });
                it(`italic: should provide sensible output for input: ${input}`, () => {
                    const actual = testModule.italic(input);
                    actual.should.equal(`*${expected}*`);
                });
                it(`bolditalic: should provide sensible output for input: ${input}`, () => {
                    const actual = testModule.bolditalic(input);
                    actual.should.equal(`***${expected}***`);
                });
            });
        });
    });
    describe('hyperlinks', () => {
        it('should generate link for bare url', () => {
            const expected = '[Click Me.](/some/link)';
            testModule.link('/some/link').should.equal(expected);
        });
        it('should generate link with blank link text', () => {
            const expected = '[Click Me.](/some/link)';
            testModule.link('/some/link', '').should.equal(expected);
        });
        it('should generate link with link text', () => {
            const expected = '[hi there](/some/link)';
            testModule.link('/some/link', 'hi there').should.equal(expected);
        });
        describe('resists bad input', () => {
            describe('`url`', () => {
                [
                    undefined, null, false, '', 0, NaN, []
                ].forEach((input) => {
                    const expected = '';
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.link(input);
                        actual.should.equal(expected);
                    });
                });
                [
                    ['Summer Glau', '[Click Me.](Summer Glau)'],
                    [4, '[Click Me.](4)'],
                    [3.1415, '[Click Me.](3.1415)'],
                    [true, '[Click Me.](true)'],
                    [{}, '[Click Me.]([object Object])']
                ].forEach((cfg) => {
                    const input = cfg[0],
                        expected = cfg[1];
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.link(input);
                        actual.should.equal(expected);
                    });
                });
            });
            describe('`linkText`', () => {
                [
                    undefined, null, false, '', 0, NaN, []
                ].forEach((input) => {
                    const expected = '[Click Me.](Agent 47)';
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.link('Agent 47', input);
                        actual.should.equal(expected);
                    });
                });
                [
                    ['Summer Glau', '[Summer Glau](Agent 47)'],
                    [4, '[4](Agent 47)'],
                    [3.1415, '[3.1415](Agent 47)'],
                    [true, '[true](Agent 47)'],
                    [{}, '[[object Object]](Agent 47)']
                ].forEach((cfg) => {
                    const input = cfg[0],
                        expected = cfg[1];
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.link('Agent 47', input);
                        actual.should.equal(expected);
                    });
                });
            });
        });
    });
    describe('images', () => {
        it('should generate basic image', () => {
            const expected = '![a.png](/a.png "a.png")';
            testModule.image('/a.png').should.equal(expected);
        });
        it('should generate alt text and title text from url', () => {
            const expected = '![a.png](https://example.com/some/weird/path/a.png "a.png")';
            testModule.image('https://example.com/some/weird/path/a.png').should.equal(expected);
        });
        it('should include alt and title text', () => {
            const expected = '![some text](/a.png "some text")';
            testModule.image('/a.png', 'some text').should.equal(expected);
        });
        it('should sanitize alt and title text', () => {
            const expected = '![some "bad" text](/a.png "some bad text")';
            testModule.image('/a.png', 'some "bad" text').should.equal(expected);
        });
        describe('resists bad input', () => {
            describe('`url`', () => {
                [
                    undefined, null, false, '', 0, NaN, []
                ].forEach((input) => {
                    const expected = '';
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.image(input);
                        actual.should.equal(expected);
                    });
                });
                [
                    ['Summer Glau', '![Summer Glau](Summer Glau "Summer Glau")'],
                    [4, '![4](4 "4")'],
                    [3.1415, '![3.1415](3.1415 "3.1415")'],
                    [true, '![true](true "true")'],
                    [{}, '![[object Object]]([object Object] "[object Object]")']
                ].forEach((cfg) => {
                    const input = cfg[0],
                        expected = cfg[1];
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.image(input);
                        actual.should.equal(expected);
                    });
                });
            });
            describe('`titleText`', () => {
                [
                    undefined, null, false, '', 0, NaN, []
                ].forEach((input) => {
                    const expected = '![15.png](15.png "15.png")';
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.image('15.png', input);
                        actual.should.equal(expected);
                    });
                });
                [
                    ['Summer Glau', '![Summer Glau](15.png "Summer Glau")'],
                    [4, '![4](15.png "4")'],
                    [3.1415, '![3.1415](15.png "3.1415")'],
                    [true, '![true](15.png "true")'],
                    [{}, '![[object Object]](15.png "[object Object]")']
                ].forEach((cfg) => {
                    const input = cfg[0],
                        expected = cfg[1];
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.image('15.png', input);
                        actual.should.equal(expected);
                    });
                });
            });
        });
    });
    describe('spoilers', () => {
        it('should generate spoiler', () => {
            const expected = '<details><summary>SPOILER!</summary>they were dead all along</details>';
            testModule.spoiler('they were dead all along').should.equal(expected);
        });
        it('should generate spoilerwith title', () => {
            const expected = '<details><summary>surprise!</summary>they were dead all along</details>';
            testModule.spoiler('they were dead all along', 'surprise!').should.equal(expected);
        });
        describe('resists bad input', () => {
            describe('`body`', () => {
                [
                    undefined, null, false, '', 0, NaN, []
                ].forEach((input) => {
                    const expected = '';
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.spoiler(input);
                        actual.should.equal(expected);
                    });
                });
                [
                    ['Summer Glau', '<details><summary>SPOILER!</summary>Summer Glau</details>'],
                    [4, '<details><summary>SPOILER!</summary>4</details>'],
                    [3.1415, '<details><summary>SPOILER!</summary>3.1415</details>'],
                    [true, '<details><summary>SPOILER!</summary>true</details>'],
                    [{}, '<details><summary>SPOILER!</summary>[object Object]</details>']
                ].forEach((cfg) => {
                    const input = cfg[0],
                        expected = cfg[1];
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.spoiler(input);
                        actual.should.equal(expected);
                    });
                });
            });
            describe('`title`', () => {
                [
                    undefined, null, false, '', 0, NaN, []
                ].forEach((input) => {
                    const expected = '<details><summary>SPOILER!</summary>they were dead all along</details>';
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.spoiler('they were dead all along', input);
                        actual.should.equal(expected);
                    });
                });
                [
                    ['Summer Glau', '<details><summary>Summer Glau</summary>they were dead all along</details>'],
                    [4, '<details><summary>4</summary>they were dead all along</details>'],
                    [3.1415, '<details><summary>3.1415</summary>they were dead all along</details>'],
                    [true, '<details><summary>true</summary>they were dead all along</details>'],
                    [{}, '<details><summary>[object Object]</summary>they were dead all along</details>']
                ].forEach((cfg) => {
                    const input = cfg[0],
                        expected = cfg[1];
                    it(`should provide sensible output for input: ${input}`, () => {
                        const actual = testModule.spoiler('they were dead all along', input);
                        actual.should.equal(expected);
                    });
                });
            });
        });
    });
});

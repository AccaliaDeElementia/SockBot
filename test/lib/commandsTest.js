'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-string'));
chai.should();
const expect = chai.expect;

const sinon = require('sinon');
require('sinon-as-promised');
chai.use(require('sinon-chai'));

const commands = require('../../lib/commands');
const utils = require('../../lib/utils');

describe('lib/config', () => {
    describe('exports', () => {
        const fns = ['bindCommands'],
            objs = ['internals'],
            vals = [];

        describe('should export expected functions:', () => {
            fns.forEach((fn) => {
                it(`${fn}()`, () => expect(commands[fn]).to.be.a('function'));
            });
        });
        describe('should export expected objects', () => {
            objs.forEach((obj) => {
                it(obj, () => expect(commands[obj]).to.be.a('object'));
            });
        });
        describe('should export expected values', () => {
            vals.forEach((val) => {
                it(val, () => commands.should.have.any.key(val));
            });
        });
        it('should export only expected keys', () => {
            commands.should.have.all.keys(fns.concat(objs, vals));
        });
    });
    describe('internals', () => {
        before(() => commands.bindCommands({}));
        const fns = ['Commands', 'Command', 'parseLine', 'getCommandHelps', 'cmdHelp', 'defaultHandler',
                'onError', 'onComplete'
            ],
            objs = ['handlers', 'shadowHandlers', 'forbiddenCmds', 'helpTopics'],
            vals = [];

        describe('should internalize expected functions:', () => {
            fns.forEach((fn) => {
                it(`${fn}()`, () => expect(commands.internals[fn]).to.be.a('function'));
            });
        });
        describe('should internalize expected objects', () => {
            objs.forEach((obj) => {
                it(obj, () => expect(commands.internals[obj]).to.be.a('object'));
            });
        });
        describe('should internalize expected values', () => {
            vals.forEach((val) => {
                it(val, () => commands.internals.should.have.any.key(val));
            });
        });
        it('should internalize only expected keys', () => {
            commands.internals.should.have.all.keys(fns.concat(objs, vals));
        });
    });
    describe('internals.parseLine()', () => {
        let parseLine;
        before(() => {
            commands.bindCommands({
                username: 'fred'
            });
            parseLine = commands.internals.parseLine;
        });
        describe('imperative commands', () => {
            describe('output object format', () => {
                it('should match bare command', () => {
                    parseLine('!help').should.have.all.keys(['line', 'command', 'commandText', 'args', 'mention']);
                });
                it('should copy input into output object', () => {
                    parseLine('!help arg1 arg2').line.should.equal('!help arg1 arg2');
                });
                it('should set command in output object', () => {
                    parseLine('!help arg1 arg2').command.should.equal('help');
                });
                it('should normalize command case in output object', () => {
                    parseLine('!HELP arg1 arg2').command.should.equal('help');
                });
                it('should store original command case in output object', () => {
                    parseLine('!HeLp arg1 arg2').commandText.should.equal('HeLp');
                });
                it('should set args correctly', () => {
                    parseLine('!help arg1 arg2').args.should.deep.equal(['arg1', 'arg2']);
                });
                it('should not set mention value', () => {
                    parseLine('!help arg1 arg2').mention.should.be.false;
                });
            });
            describe('any space character should split args', () => {
                [' ', '\f', '\t', '\v', '\u00a0', '\u1680', '\u180e', '\u2000', '\u2001', '\u2002', '\u2003', '\u2004',
                    '\u2005', '\u2006', '\u2007', '\u2008', '\u2009', '\u200a', '\u2028', '\u2029', '\u202f', '\u205f',
                    '\u3000'
                ].forEach((space) => {
                    let str = `0000${space.charCodeAt().toString(16)}`;
                    str = `\\u${str.substring(str.length - 4)}`;
                    it(`: ${str}`, () => {
                        const input = `!help${space}arg1${space}arg2`;
                        parseLine(input).args.should.deep.equal(['arg1', 'arg2']);
                    });
                });
            });
            it('should not match simple text', () => {
                expect(parseLine('simple text stuff')).to.equal(null);
            });
            it('should not match exclamation at end of text', () => {
                expect(parseLine('simple text stuff!')).to.equal(null);
            });
            it('should not match exclamation in text', () => {
                expect(parseLine('simple! text stuff')).to.equal(null);
            });
            it('should not match exclamation with text before', () => {
                expect(parseLine('si!mple text stuff')).to.equal(null);
            });
            it('should not match short command', () => {
                expect(parseLine('!cm text stuff')).to.equal(null);
            });
            it('should not match really short command', () => {
                expect(parseLine('!c text stuff')).to.equal(null);
            });
            it('should match bare command', () => {
                parseLine('!help').command.should.equal('help');
            });
            it('should match command with args', () => {
                const cmd = parseLine('!help arg1 arg2');
                cmd.command.should.equal('help');
                cmd.args.should.deep.equal(['arg1', 'arg2']);
            });
        });
        describe('mention commands', () => {
            describe('output object format', () => {
                it('should match bare command', () => {
                    parseLine('@fred help').should.have.all.keys(['line', 'command', 'commandText', 'args', 'mention']);
                });
                it('should copy input into output object', () => {
                    parseLine('@fred help arg1 arg2').line.should.equal('@fred help arg1 arg2');
                });
                it('should set command in output object', () => {
                    parseLine('@fred help arg1 arg2').command.should.equal('help');
                });
                it('should normalize command case in output object', () => {
                    parseLine('@fred HELP arg1 arg2').command.should.equal('help');
                });
                it('should store original command case in output object', () => {
                    parseLine('@fred hElP arg1 arg2').commandText.should.equal('hElP');
                });
                it('should set args correctly', () => {
                    parseLine('@fred help arg1 arg2').args.should.deep.equal(['arg1', 'arg2']);
                });
                it('should set mention value', () => {
                    parseLine('@fred help arg1 arg2').mention.should.be.true;
                });
            });
            describe('any space character should split args', () => {
                [' ', '\f', '\t', '\v', '\u00a0', '\u1680', '\u180e', '\u2000', '\u2001', '\u2002', '\u2003', '\u2004',
                    '\u2005', '\u2006', '\u2007', '\u2008', '\u2009', '\u200a', '\u2028', '\u2029', '\u202f', '\u205f',
                    '\u3000'
                ].forEach((space) => {
                    let str = `0000${space.charCodeAt().toString(16)}`;
                    str = `\\u${str.substring(str.length - 4)}`;
                    it(`: ${str}`, () => {
                        const input = `@fred${space}help${space}arg1${space}arg2`;
                        parseLine(input).args.should.deep.equal(['arg1', 'arg2']);
                    });
                });
            });
            it('should not match simple text', () => {
                expect(parseLine('simple text stuff')).to.equal(null);
            });
            it('should not match mention at end of text', () => {
                expect(parseLine('simple text stuff @fred')).to.equal(null);
            });
            it('should not match mention in text', () => {
                expect(parseLine('simple @fred  text stuff')).to.equal(null);
            });
            it('should not match short command', () => {
                expect(parseLine('@fred cm text stuff')).to.equal(null);
            });
            it('should not match really short command', () => {
                expect(parseLine('@fred c text stuff')).to.equal(null);
            });
            it('should not match wroing user mention command', () => {
                expect(parseLine('@wilma c text stuff')).to.equal(null);
            });
            it('should match canse insensitive mention command', () => {
                parseLine('@FRED help').command.should.equal('help');
            });
            it('should match bare command', () => {
                parseLine('@fred help').command.should.equal('help');
            });
            it('should match command with args', () => {
                const cmd = parseLine('@fred help arg1 arg2');
                cmd.command.should.equal('help');
                cmd.args.should.deep.equal(['arg1', 'arg2']);
            });
        });
    });
    describe('internals.onComplete()', () => {
        let forum, onComplete, spy;
        beforeEach(() => {
            spy = sinon.stub().resolves();
            forum = {
                Post: {
                    reply: sinon.stub()
                }
            };
            forum.Post.reply.resolves();
            commands.bindCommands(forum);
            onComplete = commands.internals.onComplete;
        });
        it('should not attempt to post on no content', () => {
            const command = {
                commands: [{
                    replyText: ''
                }],
                _replyFn: spy
            };
            return onComplete(command)
                .then(() => {
                    spy.called.should.be.false;
                });
        });
        it('should not attempt to post on whitespace content', () => {
            const command = {
                commands: [{
                    replyText: ' '
                }],
                _replyFn: spy
            };
            return onComplete(command)
                .then(() => {
                    spy.called.should.be.false;
                });
        });
        it('should post with content', () => {
            const command = {
                commands: [{
                    replyText: 'foo'
                }],
                ids: {
                    topic: 45,
                    post: -7
                },
                _replyFn: spy
            };
            return onComplete(command)
                .then(() => {
                    spy.should.have.been.calledWith('foo');
                });
        });
        it('should merge multiple command replies', () => {
            const command = {
                commands: [{
                    replyText: 'foo'
                }, {
                    replyText: 'bar'
                }],
                ids: {
                    topic: 45,
                    post: -7
                },
                _replyFn: spy
            };
            return onComplete(command)
                .then(() => {
                    spy.should.have.been.calledWith('foo\n\n---\n\nbar');
                });
        });
        it('should merge preseve whitespace in command replies', () => {
            const command = {
                commands: [{
                    replyText: '\nfoo '
                }, {
                    replyText: '\tbar\n'
                }],
                ids: {
                    topic: 45,
                    post: -7
                },
                _replyFn: spy
            };
            return onComplete(command)
                .then(() => {
                    spy.should.have.been.calledWith('\nfoo \n\n---\n\n\tbar\n');
                });
        });
        it('should ignore blank command replies', () => {
            const command = {
                commands: [{
                    replyText: '\n\t'
                }, {
                    replyText: 'foo'
                }, {
                    replyText: '\n'
                }, {
                    replyText: 'bar'
                }, {
                    replyText: ' '
                }],
                ids: {
                    topic: 45,
                    post: -7
                },
                _replyFn: spy
            };
            return onComplete(command)
                .then(() => {
                    spy.should.have.been.calledWith('foo\n\n---\n\nbar');
                });
        });
    });
    describe('internals.onError()', () => {
        let forum = null,
            onError = null;
        beforeEach(() => {
            forum = {
                Post: {
                    reply: sinon.stub()
                }
            };
            forum.Post.reply.resolves();
            commands.bindCommands(forum);
            onError = commands.internals.onError;
        });
        it('should post error message', () => {
            const spy = sinon.stub().resolves();
            return onError('a florgle wozzer was grutzed', {
                ids: {
                    topic: 3.14,
                    post: 'hi'
                },
                _replyFn: spy
            }).then(() => {
                forum.Post.reply.called.should.be.false;
                spy.calledWith('An unexpected error `a florgle wozzer was grutzed` ' +
                    'occured and your commands could not be processed!').should.be.true;
            });
        });
        it('should post error message from exception', () => {
            const spy = sinon.stub().resolves();
            const err = new Error('a florgle wozzer was grutzed');
            return onError(err, {
                _replyFn: spy
            }).then(() => {
                forum.Post.reply.called.should.be.false;
                spy.calledWith('An unexpected error `a florgle wozzer was grutzed` ' +
                    'occured and your commands could not be processed!').should.be.true;
            });
        });
        it('should post [object Object] from random object', () => {
            const spy = sinon.stub().resolves();
            const err = {};
            return onError(err, {
                _replyFn: spy
            }).then(() => {
                forum.Post.reply.called.should.be.false;
                spy.calledWith('An unexpected error `[object Object]` ' +
                    'occured and your commands could not be processed!').should.be.true;
            });
        });
    });
    describe('internals.defaultHandler()', () => {
        let forum = null,
            defaultHandler = null;
        beforeEach(() => {
            forum = {};
            commands.bindCommands(forum);
            defaultHandler = commands.internals.defaultHandler;
        });
        it('should reply with message to imperative command', () => {
            const command = {
                command: 'kittens',
                mention: false,
                reply: sinon.spy()
            };
            return defaultHandler(command).then(() => {
                command.reply.should.have.been.calledWith('Command `kittens` is not recognized');
            });
        });
        it('should not reply with message to mention command', () => {
            const command = {
                command: 'kittens',
                mention: true,
                reply: sinon.spy()
            };
            return defaultHandler(command).then(() => {
                command.reply.called.should.be.false;
            });
        });
    });
    describe('internals.cmdHelp', () => {
        let forum = null,
            cmdHelp = null;
        beforeEach(() => {
            forum = {
                Post: {
                    reply: sinon.stub()
                }
            };
            forum.Post.reply.resolves();
            commands.bindCommands(forum);
            cmdHelp = commands.internals.cmdHelp;
        });
        it('should be registered as `command#help` event', () => {
            commands.internals.handlers.help.handler.should.equal(cmdHelp);
        });
        it('should post expected text', () => {
            const expected = 'Registered commands:\nhelp: print command help listing\n' +
                'shutup: tell me to shutup\n\n* Help topic available.\n\nIssue the `help`' +
                ' command with an available help topic as a parameter to read additonal help';
            commands.internals.handlers.help = {
                help: 'print command help listing'
            };
            commands.internals.handlers.shutup = {
                help: 'tell me to shutup'
            };
            const spy = sinon.spy();
            cmdHelp({
                command: 'foobar',
                reply: spy
            });
            spy.firstCall.args[0].should.equal(expected);
        });
        it('should post expected text with help topics', () => {
            const expected = 'Registered commands:\nhelp: print command help listing\n\n' +
                'Help Topics:\nshutup: Extended help topic\n\n* Help topic available.\n\n' +
                'Issue the `help` command with an available help topic as a parameter to ' +
                'read additonal help';
            commands.internals.handlers.help = {
                help: 'print command help listing'
            };
            commands.internals.helpTopics.shutup = 'tell me to shutup';
            const spy = sinon.spy();
            cmdHelp({
                command: 'foobar',
                reply: spy
            });
            spy.firstCall.args[0].should.equal(expected);
        });

        it('should indicate presence of help topic on command', () => {
            const expected = 'Registered commands:\nhelp: print command help listing *\n\n' +
                '* Help topic available.\n\nIssue the `help` command with an available help ' +
                'topic as a parameter to read additonal help';
            commands.internals.handlers.help = {
                help: 'print command help listing'
            };
            commands.internals.helpTopics.help = 'foobar';
            const spy = sinon.spy();
            cmdHelp({
                command: 'foobar',
                reply: spy
            });
            spy.firstCall.args[0].should.equal(expected);
        });
        describe('with parameters', () => {
            it('should post default text without parameters', () => {
                const expected = 'Registered commands:';
                const spy = sinon.spy();
                cmdHelp({
                    command: 'foobar',
                    reply: spy
                });
                spy.firstCall.args[0].should.startWith(expected);
            });
            it('should post default text when called with empty parameters', () => {
                const expected = 'Registered commands:';
                const spy = sinon.spy();
                cmdHelp({
                    command: 'foobar',
                    args: [],
                    reply: spy
                });
                spy.firstCall.args[0].should.startWith(expected);
            });
            it('should post default text when called with unexpected parameters', () => {
                const expected = 'Registered commands:';

                const spy = sinon.spy();
                cmdHelp({
                    command: 'foobar',

                    args: ['i', 'am', 'not', 'a', 'command'],
                    reply: spy
                });
                spy.firstCall.args[0].should.startWith(expected);
            });
            it('should post extended help message one word command', () => {
                const expected = 'Help topic for `whosit`\n\nwhosit extended help' +
                    '\n\nIssue the `help` command without any parameters to see all available commands';
                commands.internals.helpTopics.whosit = 'whosit extended help';
                const spy = sinon.spy();
                cmdHelp({
                    command: 'foobar',
                    args: ['whosit'],
                    reply: spy
                });
                spy.firstCall.args[0].should.equal(expected);
            });
            it('should post extended help message multi-word command', () => {
                const expected = 'Help topic for `who am i`';
                commands.internals.helpTopics['who am i'] = 'whosit extended help';
                const spy = sinon.spy();
                cmdHelp({
                    command: 'foobar',
                    args: ['who', 'am', 'i'],
                    reply: spy
                });
                spy.firstCall.args[0].should.startWith(expected);
            });
        });
    });
    describe('internals.getCommandHelps()', () => {
        let cmds = null,
            forum = null,
            getCommandHelps = null;
        beforeEach(() => {
            forum = {};
            commands.bindCommands(forum);
            cmds = commands.internals.handlers;
            Object.keys(cmds).forEach((key) => delete cmds[key]);
            getCommandHelps = commands.internals.getCommandHelps;
        });
        it('should return default text', () => {
            const expected = 'Registered commands:',
                result = getCommandHelps();
            result.should.equal(expected);
        });
        it('should return help for one command', () => {
            cmds.help = {
                help: 'foobar'
            };
            const expected = 'Registered commands:\nhelp: foobar',
                result = getCommandHelps();
            result.should.equal(expected);
        });
        it('should return sort commands', () => {
            cmds.help = {
                help: 'foobar'
            };
            cmds.aaa = {
                help: 'bbb'
            };
            const expected = 'Registered commands:\naaa: bbb\nhelp: foobar',
                result = getCommandHelps();
            result.should.equal(expected);
        });
    });
    describe('Command', () => {
        let forum = null,
            Command = null,
            handlers = null,
            shadowHandlers = null;
        beforeEach(() => {
            forum = {};
            commands.bindCommands(forum);
            Command = commands.internals.Command;
            handlers = commands.internals.handlers;
            shadowHandlers = commands.internals.shadowHandlers;
        });
        describe('ctor()', () => {
            it('should use utils.mapSet for storage', () => {
                const command = new Command({}, {});
                utils.mapGet(command).should.be.ok;
            });
            it('should store definition.line', () => {
                const expected = `${Math.random()}${Math.random()}`;
                const command = new Command({
                    line: expected
                }, {});
                utils.mapGet(command).line.should.equal(expected);
            });
            it('should store definition.command', () => {
                const expected = `${Math.random()}${Math.random()}`;
                const command = new Command({
                    command: expected
                }, {});
                utils.mapGet(command).command.should.equal(expected);
            });
            it('should store definition.commandText', () => {
                const expected = `${Math.random()}${Math.random()}`;
                const command = new Command({
                    commandText: expected
                }, {});
                utils.mapGet(command).commandText.should.equal(expected);
            });
            it('should store definition.args', () => {
                const expected = `${Math.random()}${Math.random()}`;
                const command = new Command({
                    args: expected
                }, {});
                utils.mapGet(command).args.should.equal(expected);
            });
            it('should store definition.mention', () => {
                const expected = `${Math.random()}${Math.random()}`;
                const command = new Command({
                    mention: expected
                }, {});
                utils.mapGet(command).mention.should.equal(expected);
            });
            it('should store default reply text', () => {
                const command = new Command({}, {});
                utils.mapGet(command).replyText.should.equal('');
            });
            it('should select defaultHandler for no command', () => {
                const command = new Command({}, {});
                utils.mapGet(command).handler.should.equal(commands.internals.defaultHandler);
            });
            it('should select defaultHandler for invalid command', () => {
                const command = new Command({
                    command: 'ook!'
                }, {});
                utils.mapGet(command).handler.should.equal(commands.internals.defaultHandler);
            });
            it('should select registered handler for valid command', () => {
                const expected = sinon.spy();
                handlers.ook = {
                    handler: expected
                };
                const command = new Command({
                    command: 'ook'
                }, {});
                utils.mapGet(command).handler.should.equal(expected);
            });
            it('should select registered shadowHandler for valid command', () => {
                const expected = sinon.spy();
                shadowHandlers.ook = expected;
                const command = new Command({
                    command: 'ook'
                }, {});
                utils.mapGet(command).handler.should.equal(expected);
            });
            it('should select registered handler for valid command when shadowHandler also exists', () => {
                const expected = sinon.spy();
                shadowHandlers.ook = sinon.spy();
                handlers.ook = {
                    handler: expected
                };
                const command = new Command({
                    command: 'ook'
                }, {});
                utils.mapGet(command).handler.should.equal(expected);
            });
            it('should store a reference to parent Commands', () => {
                const expected = sinon.spy();
                const command = new Command({}, expected);
                utils.mapGet(command).parent.should.equal(expected);
            });
            it('should set executable for unknown imperative command', () => {
                const command = new Command({
                    mention: false,
                    command: 'ook!'
                }, {});
                utils.mapGet(command).executable.should.be.true;
            });
            it('should set executable for known imperative command', () => {
                const command = new Command({
                    mention: false,
                    command: 'help'
                }, {});
                utils.mapGet(command).executable.should.be.true;
            });
            it('should not set executable for unknown mention command', () => {
                const command = new Command({
                    mention: true,
                    command: 'ook!'
                }, {});
                utils.mapGet(command).executable.should.be.false;
            });
            it('should set executable for known mention command', () => {
                const command = new Command({
                    mention: true,
                    command: 'help'
                }, {});
                utils.mapGet(command).executable.should.be.true;
            });
        });
        describe('simple getters', () => {
            let command, data;
            beforeEach(() => {
                command = new Command({}, {});
                data = utils.mapGet(command);
            });
            ['line', 'command', 'commandText', 'mention', 'args', 'parent',
                'replyText', 'executable'
            ].forEach((property) => {
                it(`should allow get of ${property} from storage`, () => {
                    const expected = Math.random();
                    data[property] = expected;
                    command[property].should.equal(expected);
                });
                it(`should disallow setting value to ${property}`, () => {
                    expect(() => {
                        command[property] = 'foo';
                    }).to.throw();
                });
            });
        });
        describe('proxied getters', () => {
            let command, parent;
            beforeEach(() => {
                parent = {
                    getPost: sinon.stub(),
                    getTopic: sinon.stub(),
                    getUser: sinon.stub()
                };
                command = new Command({}, parent);
            });
            it('should proxy getPost() to parent.getPost()', () => {
                const expected = Math.random();
                parent.getPost.returns(expected);
                command.getPost().should.equal(expected);
                parent.getPost.called.should.be.true;
            });
            it('should proxy getTopic() to parent.getTopic()', () => {
                const expected = Math.random();
                parent.getTopic.returns(expected);
                command.getTopic().should.equal(expected);
                parent.getTopic.called.should.be.true;
            });
            it('should proxy getUser() to parent.getUser()', () => {
                const expected = Math.random();
                parent.getUser.returns(expected);
                command.getUser().should.equal(expected);
                parent.getUser.called.should.be.true;
            });
        });
        describe('reply()', () => {
            let command, data;
            beforeEach(() => {
                command = new Command({}, {});
                data = utils.mapGet(command);
            });
            it('should set replyText property', () => {
                const expected = `a${Math.random()}b`;
                command.reply(expected);
                data.replyText.should.equal(expected);
            });
        });
        describe('appendReply()', () => {
            let command, data;
            beforeEach(() => {
                command = new Command({}, {});
                data = utils.mapGet(command);
            });
            it('should set replyText property', () => {
                const expected = `a${Math.random()}b`;
                command.appendReply(expected);
                data.replyText.should.equal(expected);
            });
            it('should add to replyText property', () => {
                data.replyText = 'foobar';
                const content = `a${Math.random()}b`;
                command.appendReply(content);
                data.replyText.should.equal(`foobar\n\n${content}`);
            });
        });
        describe('execute()', () => {
            let command, data;
            beforeEach(() => {
                command = new Command({}, {});
                data = utils.mapGet(command);
            });
            it('should execute executable command', () => {
                const spy = sinon.stub().resolves();
                data.handler = spy;
                data.executable = true;
                return command.execute().then(() => {
                    spy.called.should.be.true;
                });
            });
            it('should bypass execution for non-executable command', () => {
                const spy = sinon.stub().resolves();
                data.handler = spy;
                data.executable = false;
                return command.execute().then(() => {
                    spy.called.should.be.false;
                });
            });
        });
    });
    describe('Commands', () => {
        let forum, Commands, username;
        beforeEach(() => {
            username = `fred_${Math.random()}`;
            forum = {
                username: username
            };
            commands.bindCommands(forum);
            Commands = commands.internals.Commands;
        });
        describe('ctor()', () => {
            it('should use utils.mapSet for storage', () => {
                const command = new Commands({}, '');
                utils.mapGet(command).should.be.ok;
            });
            it('should store ids parameter', () => {
                const expected = `${Math.random()}${Math.random()}`;
                const command = new Commands(expected, '');
                utils.mapGet(command).ids.should.equal(expected);
            });
            it('should store postbody parameter', () => {
                const expected = `${Math.random()}${Math.random()}`;
                const command = new Commands({}, expected);
                utils.mapGet(command).postBody.should.equal(expected);
            });
            it('should store commands array', () => {
                const expected = '';
                const command = new Commands({}, expected);
                utils.mapGet(command).commands.should.be.an('Array');
            });
            it('should store parsed commands', () => {
                const expected = '!123\n!456';
                const command = new Commands({}, expected);
                utils.mapGet(command).commands.should.have.length(2);
            });
            it('should store parsed commands', () => {
                const expected = '!123\n!456';
                const command = new Commands({}, expected);
                utils.mapGet(command).commands.should.have.length(2);
            });
            it('should store parsed mention commands', () => {
                const expected = `@${username} help`;
                const command = new Commands({}, expected);
                utils.mapGet(command).commands.should.have.length(1);
            });
            it('should ignore unknown mention commands', () => {
                const expected = `@${username} NOT_A_COMMAND_${Math.random()}`;
                const command = new Commands({}, expected);
                utils.mapGet(command).commands.should.have.length(0);
            });
        });
        describe('simple getters', () => {
            let command, data;
            beforeEach(() => {
                command = new Commands({}, '');
                data = utils.mapGet(command);
            });
            ['ids', 'commands', '_replyFn'].forEach((property) => {
                it(`should allow get of ${property} from storage`, () => {
                    const expected = Math.random();
                    data[property] = expected;
                    command[property].should.equal(expected);
                });
                it(`should disallow setting value to ${property}`, () => {
                    expect(() => {
                        command[property] = 'foo';
                    }).to.throw();
                });
            });
            it('should allow get of text from storage', () => {
                const expected = Math.random();
                data.postBody = expected;
                command.text.should.equal(expected);
            });
            it('should disallow setting value to text', () => {
                expect(() => {
                    command.text = 'foo';
                }).to.throw();
            });
        });
        describe('cached getters', () => {
            [
                ['getPost', 'Post', 'post'],
                ['getTopic', 'Topic', 'topic'],
                ['getUser', 'User', 'user']
            ].forEach((config) => {
                const method = config[0],
                    object = config[1],
                    store = config[2];
                let command, spy, data, notification;
                beforeEach(() => {
                    notification = {};
                    command = new Commands(notification, '');
                    spy = sinon.stub().resolves();
                    forum[object] = {
                        get: spy
                    };
                    data = utils.mapGet(command);
                });
                it(`should resolve to cached ${object} when set`, () => {
                    const expected = Math.random();
                    data[store] = expected;
                    return command[method]().then((item) => {
                        item.should.equal(expected);
                        spy.called.should.be.false;
                    });
                });
                it(`should request ${store} by notification ${store}`, () => {
                    const id = Math.random();
                    notification[store] = id;
                    expect(data[store]).to.be.not.ok;
                    return command[method]().then(() => {
                        spy.should.have.been.calledWith(id);
                    });
                });
                it(`should resolve to fetched ${object}`, () => {
                    const expected = Math.random();
                    spy.resolves(expected);
                    return command[method]().should.become(expected);
                });
                it(`should cache fetched ${object}`, () => {
                    const expected = Math.random();
                    spy.resolves(expected);
                    return command[method]().then(() => {
                        data[store].should.equal(expected);
                    });
                });
            });
        });
        describe('cached setters', () => {
            [
                ['setPost', 'post'],
                ['setTopic', 'topic'],
                ['setUser', 'user']
            ].forEach((config) => {
                const method = config[0],
                    store = config[1];
                let command, data, notification;
                beforeEach(() => {
                    notification = {};
                    command = new Commands(notification, '');
                    data = utils.mapGet(command);
                });
                it(`should save ${store} when set`, () => {
                    const expected = Math.random();
                    command[method](expected);
                    data[store].should.equal(expected);
                });
                it(`should throw when ${store} is already set`, () => {
                    const expected = Math.random();
                    data[store] = expected;
                    expect(() => command[method](Math.random())).to.throw('E_ALREADY_SET');
                });
            });
        });
        describe('execute()', () => {
            describe('non limited commands', () => {
                let command, data;
                beforeEach(() => {
                    command = new Commands({}, '');
                    data = utils.mapGet(command);
                    data._replyFn = sinon.stub().resolves();
                });
                it('should resolve to executing instance', () => {
                    return command.execute().should.become(command);
                });
                it('should execute contained commands', () => {
                    const spy = sinon.stub().resolves();
                    const cmd = {
                        execute: spy
                    };
                    data.commands = [cmd, cmd, cmd, cmd];
                    return command.execute().then(() => {
                        spy.callCount.should.equal(4);
                    });
                });
                it('should execute contained commands sequentially', () => {
                    data.commands = [];
                    for (let i = 0; i < 10; i += 1) {
                        data.commands.push({
                            execute: sinon.stub().resolves()
                        });
                    }
                    return command.execute().then(() => {
                        for (let i = 0; i < data.commands.length - 1; i += 1) {
                            const spy1 = data.commands[i].execute,
                                spy2 = data.commands[i + 1].execute;
                            spy1.calledBefore(spy2).should.be.true;
                        }
                    });
                });
                it('should post command results', () => {
                    forum.Post = {
                        reply: sinon.stub().resolves()
                    };
                    const expected = 'foo';
                    data.ids.post = 1;
                    data.ids.topic = 50;
                    data.commands = [{
                        execute: sinon.stub().resolves(),
                        replyText: expected
                    }];
                    data._replyFn = sinon.stub().resolves();
                    return command.execute().then(() => {
                        data._replyFn.should.have.been.calledWith(expected);
                    });
                });
                it('should execute onError when any command rejects', () => {
                    forum.Post = {
                        reply: sinon.stub().rejects('foo')
                    };
                    forum.emit = sinon.spy();
                    const spy = sinon.stub().resolves();
                    const rejector = sinon.stub().rejects('bad');
                    data.ids.post = 1;
                    data.ids.topic = 50;
                    data._replyFn = sinon.stub().resolves();
                    data.commands = [{
                        execute: spy
                    }, {
                        execute: rejector
                    }, {
                        execute: spy
                    }];
                    return command.execute().then(() => {
                        forum.Post.reply.called.should.be.false;
                        data._replyFn.calledWith('An unexpected error `bad` occured and your commands' +
                            ' could not be processed!').should.be.true;
                    });
                });
                it('should emit error when onError rejects', () => {
                    forum.emit = sinon.spy();
                    data.commands = [{
                        execute: sinon.stub().rejects('bad')
                    }];
                    data._replyFn = sinon.stub().rejects('badbad');
                    return command.execute().then(() => {
                        forum.emit.should.have.been.calledWith('logError');
                    });
                });
            });
            describe('too many commands executing', () => {
                let command, data;
                beforeEach(() => {
                    forum.emit = sinon.spy();
                    command = new Commands({}, '');
                    data = utils.mapGet(command);
                    data._replyFn = sinon.stub().resolves();
                    data.commands = [];
                    for (let i = 0; i < 20; i += 1) {
                        data.commands.push({
                            execute: sinon.stub().resolves()
                        });
                    }
                });
                it('should resolve to executing instance', () => {
                    return command.execute().should.become(command);
                });
                it('should not execute contained commands', () => {
                    return command.execute().then(() => {
                        data.commands.forEach((cmd) => {
                            cmd.execute.called.should.be.false;
                        });
                    });
                });
                it('should post rate limit results', () => {
                    const expected = 'Your request contained too many commands to process.\n' +
                        '\nPlease try again with fewer commands.';
                    data._replyFn = sinon.stub().resolves();
                    return command.execute().then(() => {
                        data._replyFn.should.have.been.calledWith(expected);
                    });
                });
                it('should emit error when limiting execution', () => {
                    return command.execute().then(() => {
                        forum.emit.should.have.been.calledWith('logError');
                    });
                });
            });
        });
        describe('static get()', () => {
            it('should store notification in result', () => {
                const ids = {
                    alpha: 1,
                    beta: 'c'
                };
                return Commands.get(ids).then((command) => {
                    command.ids.should.equal(ids);
                });
            });
            it('should store text in result', () => {
                const notification = {};
                return Commands.get(notification, '<div>content</div>').then((command) => {
                    utils.mapGet(command, 'postBody').should.equal('content');
                });
            });
        });
        describe('static add()', () => {
            let emit = null;
            beforeEach(() => {
                emit = sinon.spy();
                commands.bindCommands({
                    emit: emit
                });
            });
            it('should add command to helpers', () => {
                const cmd = `a${Math.random()}a`,
                    text = `b${Math.random()}b`,
                    handler = sinon.spy();
                expect(commands.internals.handlers[cmd]).to.be.not.ok;
                return commands.internals.Commands.add(cmd, text, handler).then(() => {
                    commands.internals.handlers[cmd].should.eql({
                        commandText: cmd,
                        handler: handler,
                        help: text
                    });
                });
            });
            it('should normalize command case for matching', () => {
                const cmd = `A${Math.random()}A`,
                    text = `b${Math.random()}b`,
                    handler = sinon.spy();
                expect(commands.internals.handlers[cmd]).to.be.not.ok;
                return commands.internals.Commands.add(cmd, text, handler).then(() => {
                    commands.internals.handlers[cmd.toLowerCase()].should.be.ok;
                });
            });
            it('should warn when registering a command where alias already exists', () => {
                const cmd = `a${Math.random()}a`;
                commands.internals.shadowHandlers[cmd] = 5;
                return commands.internals.Commands.add(cmd, 'foo', () => 0).then(() => {
                    const msg = `WARNING, ${cmd} is already registered: will override alias.`;
                    emit.should.have.been.calledWith('log', msg);
                });
            });
            it('should log error when registering a command where already exists', () => {
                const cmd = `a${Math.random()}a`;
                commands.internals.handlers[cmd] = 5;
                return commands.internals.Commands.add(cmd, 'foo', () => 0).catch(() => {
                    const msg = `ERROR, ${cmd} is already registered: cannot override existing command.`;
                    emit.should.have.been.calledWith('error', msg);
                });
            });
            it('should error when registering an alias where already exists', () => {
                const cmd = `a${Math.random()}a`;
                commands.internals.handlers[cmd] = 5;
                const Cmds = commands.internals.Commands;
                return Cmds.add(cmd, 'foo', () => 0).should.be.rejectedWith('E_ALREADY_REGISTERED');
            });
            it('should log error when registering a forbidden command', () => {
                const cmd = `a${Math.random()}a`;
                commands.internals.forbiddenCmds[cmd] = 5;
                return commands.internals.Commands.add(cmd, 'foo', () => 0).catch(() => {
                    const msg = `ERROR, ${cmd} is already registered: not allowed by the active forum provider.`;
                    emit.should.have.been.calledWith('error', msg);
                });
            });
            it('should error when registering a forbidden command', () => {
                const cmd = `a${Math.random()}a`;
                commands.internals.forbiddenCmds[cmd] = 5;
                const Cmds = commands.internals.Commands;
                return Cmds.add(cmd, 'foo', () => 0).should.be.rejectedWith('E_FORBIDDEN_COMMAND');
            });
        });
        describe('static addAlias()', () => {
            let emit = null;
            beforeEach(() => {
                emit = sinon.spy();
                commands.bindCommands({
                    emit: emit
                });
            });
            it('should add command alias to helpers', () => {
                const cmd = `a${Math.random()}a`,
                    handler = sinon.spy();
                expect(commands.internals.shadowHandlers[cmd]).to.be.not.ok;
                return commands.internals.Commands.addAlias(cmd, handler).then(() => {
                    commands.internals.shadowHandlers[cmd].should.equal(handler);
                });
            });
            it('should normalize command case for matching', () => {
                const cmd = `A${Math.random()}A`,
                    handler = sinon.spy();
                expect(commands.internals.shadowHandlers[cmd]).to.be.not.ok;
                return commands.internals.Commands.addAlias(cmd, handler).then(() => {
                    commands.internals.shadowHandlers[cmd.toLocaleLowerCase()].should.be.ok;
                });
            });
            it('should warn when registering an alias where command already exists', () => {
                const cmd = `a${Math.random()}a`;
                commands.internals.handlers[cmd] = 5;
                expect(commands.internals.shadowHandlers[cmd]).to.be.not.ok;
                return commands.internals.Commands.addAlias(cmd, () => 0).then(() => {
                    const msg = `WARNING, ${cmd} is already registered: existing command will override.`;
                    emit.should.have.been.calledWith('log', msg);
                });
            });
            it('should log error when registering an alias where already exists', () => {
                const cmd = `a${Math.random()}a`;
                commands.internals.shadowHandlers[cmd] = 5;
                return commands.internals.Commands.addAlias(cmd, () => 0).catch(() => {
                    const msg = `ERROR, ${cmd} is already registered: cannot override existing alias.`;
                    emit.should.have.been.calledWith('error');
                    emit.lastCall.args[1].should.equal(msg);
                });
            });
            it('should error when registering an alias where already exists', () => {
                const cmd = `a${Math.random()}a`;
                commands.internals.shadowHandlers[cmd] = 5;
                const Cmds = commands.internals.Commands;
                return Cmds.addAlias(cmd, () => 0).should.be.rejectedWith('E_ALREADY_REGISTERED');
            });
            it('should log error when registering a forbidden alias', () => {
                const cmd = `a${Math.random()}a`;
                commands.internals.forbiddenCmds[cmd] = 5;
                return commands.internals.Commands.addAlias(cmd, 'foo', () => 0).catch(() => {
                    const msg = `ERROR, ${cmd} is already registered: not allowed by the active forum provider.`;
                    emit.should.have.been.calledWith('error', msg);
                });
            });
            it('should error when registering a forbidden alias', () => {
                const cmd = `a${Math.random()}a`;
                commands.internals.forbiddenCmds[cmd] = 5;
                const Cmds = commands.internals.Commands;
                return Cmds.addAlias(cmd, 'foo', () => 0).should.be.rejectedWith('E_FORBIDDEN_COMMAND');
            });
        });
        describe('static forbidCommand()', () => {
            it('should forbid a command', () => {
                Object.keys(commands.internals.forbiddenCmds).should.eql([]);
                Commands.forbidCommand('foobar');
                commands.internals.forbiddenCmds.foobar.should.be.ok;
            });
            it('should forbid with capital command', () => {
                Object.keys(commands.internals.forbiddenCmds).should.eql([]);
                Commands.forbidCommand('FOOBAR');
                commands.internals.forbiddenCmds.foobar.should.be.ok;
            });
            it('should return false when command was not already forbidden', () => {
                expect(commands.internals.forbiddenCmds.foobar).to.be.undefined;
                Commands.forbidCommand('FoOBaR').should.be.false;
            });
            it('should return true when command was already forbidden', () => {
                commands.internals.forbiddenCmds.foobar = Math.random();
                Commands.forbidCommand('FooBar').should.be.true;
            });
            it('should forbid command only for current provider', () => {
                Commands.forbidCommand('FooBar');
                commands.bindCommands({}); // rebind commands
                expect(commands.internals.forbiddenCmds.foobar).to.be.undefined;
            });
        });
    });
});

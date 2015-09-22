var expect = require('chai').expect;
var scrapers = require('../scrapers');

describe('Scrapers API', function() {

    describe('.getScraper()', function() {
        it('should find known scraper', function() {
            var s = scrapers.getScraper('example.com');
            expect(s).to.be.an('object');
            expect(s.name).to.equal('example');
        });
        it('should accept http:// in url', function() {
            var s = scrapers.getScraper('http://example.com');
            expect(s).to.be.an('object');
            expect(s.name).to.equal('example');
        });
        it('should not find unknown scraper', function() {
            var s = scrapers.getScraper('test.com');
            expect(s).to.equal(false);
        });
    });

    describe('.scrape()', function() {
        it('should scrape example.com', function() {
            scrapers.scrape('example.com', function(data) {
                expect(data).to.be.an('object');
                expect(data).to.have.a.property('links');
                expect(data).to.have.a.property('date');
                expect(data).to.have.a.property('dodooo');
            });
        });
    });

    describe('Smarkets scraper', function() {
        it('should scrape horse page', function() {
            var s = scrapers.getScraper('https://smarkets.com/sport/horse-racing/carlisle/2015/07/26/14:10');
            expect(s).to.be.an('object');
            expect(s.name).to.equal('smarkets');
        });
    });
});
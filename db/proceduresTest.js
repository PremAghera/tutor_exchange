var mysql       = require('mysql');
var config      = require(__dirname + '/config');


var fakeUser = {
  userID: 99000000,
  firstName: 'John',
  lastName: 'Smith',
  DOB: '1990-01-01',
  sex: 'M',
  phone: '0432000111',
  passwordHash: 'hash',
  passwordSalt: 'salt',
};


describe('Procedures unit tests:', function() {
  var successFlag;
  var connection;

  beforeAll(function(done) {
    successFlag = false;
    connection = mysql.createConnection(config.mysqlSettings);
    connection.connect(function(err) {
      if (!!err) {
        console.log(err);
      } else {
        successFlag = true;
      }
      done();
    });
  });

  afterAll(function(done) {
    connection.end(function() {
      done();
    });
  });

  // ---------------------------------------- //
  // MYSQL CONNECTION TEST
  describe('Mysql connection', function() {
    it('should connect to database', function() {
      expect(successFlag).toBe(true);
    });
  });


  // ---------------------------------------- //
  // userExists(userID) TESTS
  describe('userExists(userID)', function() {

    // Delete user 99000000 if it exists (hopefull no one has this id)
    beforeAll(function(done) {
      connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
        if (!!err) console.log(err);
        done();
      });
    });

    // Section 1: fake user present
    describe('when user ' + fakeUser.userID + ' exists', function() {
      // Insert fake user before tests
      beforeEach(function(done) {
        connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
          if (!!err) console.log(err);
          done();
        });
      });

      // Now remove fake user
      afterEach(function(done) {
        connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          done();
        });
      });

      // Check fake user no longer exists
      it('should return 1', function(done) {
        connection.query('CALL userExists(?)', [fakeUser.userID], function(err, rows, fields) {
          var userExists = rows[0][0].userExists;
          expect(userExists).toBe(1);
          done();
        });
      });

    });

    // Section 2: fake user not present
    describe('when user ' + fakeUser.userID + ' doesn\'t exist', function() {
      // Check fake user no longer exists
      it('should return 0', function(done) {
        connection.query('CALL userExists(?)', [fakeUser.userID], function(err, rows, fields) {
          var userExists = rows[0][0].userExists;
          expect(userExists).toBe(0);
          done();
        });
      });
    });

  });


  // ---------------------------------------- //
  // createUser(userID, firstName, lastName, DOB, sex, phone, passwordHash, passwordSalt) TEST
  describe('createUser(userID, firstName, lastName, DOB, sex, phone, passwordHash, passwordSalt)', function() {

    // Delete user 99000000 if it exists (hopefull no one has this id)
    beforeAll(function(done) {
      connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
        if (!!err) console.log(err);
        done();
      });
    });

    // Now create user using createUser stored procedure
    beforeAll(function(done) {
      connection.query(
        'CALL createUser(?, ?, ?, ?, ?, ?, ?, ?)',
        [
          fakeUser.userID,
          fakeUser.firstName,
          fakeUser.lastName,
          fakeUser.DOB,
          fakeUser.sex,
          fakeUser.phone,
          fakeUser.passwordHash,
          fakeUser.passwordSalt,
        ],
        function(err) {
          if (!!err) console.log(err);
          done();
        }
      );
    });

    // Remember to remove it again when tests are finished
    afterAll(function(done) {
      connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
        if (!!err) console.log(err);
        done();
      });
    });

    // Section 1: Check user is created properly
    describe('when function is called', function() {
      // Check fake user was added
      it('should add user to database', function(done) {
        connection.query('SELECT * FROM user WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var newUser = rows[0];
          expect(newUser.userID).toBe(fakeUser.userID);
          expect(newUser.firstName).toBe(fakeUser.firstName);
          expect(newUser.lastName).toBe(fakeUser.lastName);
          expect(Date(newUser.DOB)).toBe(Date(fakeUser.DOB));
          expect(newUser.sex).toBe(fakeUser.sex);
          expect(newUser.phone).toBe(fakeUser.phone);
          expect(newUser.passwordHash).toBe(fakeUser.passwordHash);
          expect(newUser.passwordSalt).toBe(fakeUser.passwordSalt);
          done();
        });
      });
    });

    // Section 2: Try adding user with same id to database
    describe('when attempting to add user with duplicate userID', function() {
      var secondUser = {firstName: 'BOB'};
      var errorFlag = false;
      beforeEach(function(done) {
        connection.query(
          'CALL createUser(?, ?, ?, ?, ?, ?, ?, ?)',
          [
            fakeUser.userID,
            secondUser.firstName,
            fakeUser.lastName,
            fakeUser.DOB,
            fakeUser.sex,
            fakeUser.phone,
            fakeUser.passwordHash,
            fakeUser.passwordSalt,
          ],
          function(err) {
            if (!!err) errorFlag = true;
            done();
          }
        );
      });

      // mysql should throw an error when inserting with the same key
      it('should throw mysql error', function() {
        expect(errorFlag).toBe(true);
      });

      // Again, keys should be unique
      it('should not add another users', function(done) {
        connection.query('SELECT COUNT(*) FROM user WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          expect(rows[0]['COUNT(*)']).toBe(1);
          done();
        });
      });

      // Check we didn't just overwrite existing user
      it('should not overwrite existing user', function(done) {
        connection.query('SELECT firstName FROM user WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          expect(rows[0].firstName).toBe(fakeUser.firstName);
          done();
        });
      });
    });

  });


  // ---------------------------------------- //
  // getUser(userID)
  describe('getUser(userID)', function() {

    //Section 1: test when user exists
    describe('when user exists', function() {
      // Insert fake user before tests
      beforeAll(function(done) {
        connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
          if (!!err) console.log(err);
          done();
        });
      });

      // Clean up when done
      afterAll(function(done) {
        connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          done();
        });
      });

      // Check procedure returns correct user
      // Not checking fields filled with default values
      it('should return user info', function(done) {
        connection.query('CALL getUser(?)', [fakeUser.userID], function(err, rows, fields) {
          expect(rows[0].length).toBe(1);

          var returnedObject = rows[0][0];
          expect(returnedObject).toBeDefined();
          expect(returnedObject.userID).toBe(fakeUser.userID);
          expect(returnedObject.firstName).toBe(fakeUser.firstName);
          expect(returnedObject.lastName).toBe(fakeUser.lastName);
          expect(Date(returnedObject.DOB)).toBe(Date(fakeUser.DOB));
          expect(returnedObject.sex).toBe(fakeUser.sex);
          expect(returnedObject.phone).toBe(fakeUser.phone);
          expect(returnedObject.passwordHash).toBe(fakeUser.passwordHash);
          expect(returnedObject.passwordSalt).toBe(fakeUser.passwordSalt);
          done();
        });
      });
    });

    //Section 2: test when user doesn't exist
    describe('when user doesn\'t exist', function() {
      // Table should be empty if user doesn't exist
      it('should return empty table', function(done) {
        connection.query('CALL getUser(?)', [fakeUser.userID], function(err, rows, fields) {
          expect(rows[0].length).toBe(0);

          var returnedObject = rows[0][0];
          expect(returnedObject).not.toBeDefined();
          done();
        });
      });
    });

  });

  // ---------------------------------------- //
  // isBanned(userID)
  describe('getUser(userID)', function() {

    // Section 1: User is banned
    describe('when user is banned', function() {
      // Insert fake user and ban
      beforeAll(function(done) {
        connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
          if (!!err) console.log(err);
          connection.query('INSERT INTO bannedUser VALUES (?, ?)', [fakeUser.userID, 'reason'], function(err) {
            if (!!err) console.log(err);
            done();
          });
        });
      });

      // unban fake user and remove user
      afterEach(function(done) {
        connection.query('DELETE FROM bannedUser WHERE userID = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
            if (!!err) console.log(err);
            done();
          });
        });
      });

      // Check user is banned
      it('should return 1', function(done) {
        connection.query('CALL isBanned(?)', [fakeUser.userID], function(err, rows, fields) {
          var isBanned = rows[0][0].isBanned;
          expect(isBanned).toBe(1);
          done();
        });
      });
    });

    // Section 2: User is not banned
    describe('when user is not banned', function() {
      // Create fake user
      beforeAll(function(done) {
        connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
          if (!!err) console.log(err);
          done();
        });
      });

      // Delete fake user
      afterAll(function(done) {
        connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          done();
        });
      });

      // Check user isnt banned
      it('should return 0', function(done) {
        connection.query('CALL isBanned(?)', [fakeUser.userID], function(err, rows, fields) {
          var isBanned = rows[0][0].isBanned;
          expect(isBanned).toBe(0);
          done();
        });
      });
    });


    // Section 3: User doesn't exist
    describe('when user does not exist', function() {
      it('should return 0', function(done) {
        connection.query('CALL isBanned(?)', [fakeUser.userID], function(err, rows, fields) {
          var isBanned = rows[0][0].isBanned;
          expect(isBanned).toBe(0);
          done();
        });
      });
    });

  });


  // ---------------------------------------- //
  // upgradeToTutor(userID)
  describe('upgradeToTutor(userID)', function() {

    // Section 1: user exists
    describe('when user exists', function() {
      // Add fake user and call function
      beforeAll(function(done) {
        connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
          if (!!err) console.log(err);
          connection.query('CALL upgradeToTutor(?)', [fakeUser.userID], function(err) {
            if (!!err) console.log(err);
            done();
          });
        });
      });

      // Clean up after test
      afterAll(function(done) {
        connection.query('DELETE FROM tutor WHERE userID = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
            if (!!err) console.log(err);
            done();
          });
        });
      });

      // See if user was added to tutors
      it('should add user to tutor list', function(done) {
        connection.query('SELECT COUNT(*) FROM tutor WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var isTutor = rows[0]['COUNT(*)'];
          expect(isTutor).toBe(1);
          done();
        });
      });
    });

    // Section 2: user doesn't exist
    describe('when user does not exist', function() {
      var errorFlag = false;

      // Add fake user and call function
      beforeAll(function(done) {
        connection.query('CALL upgradeToTutor(?)', [fakeUser.userID], function(err) {
          if (!!err) errorFlag = true;
          done();
        });
      });

      // Clean up after test
      afterAll(function(done) {
        connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          done();
        });
      });

      // See if function threw a mysql error
      it('should throw a mysql error', function() {
        expect(errorFlag).toBe(true);
      });

      // Check user wasn't added to tutors list
      it('should not add user to tutor list', function(done) {
        connection.query('SELECT COUNT(*) FROM tutor WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var isTutor = rows[0]['COUNT(*)'];
          expect(isTutor).toBe(0);
          done();
        });
      });
    });

    // Section 3: user already is a tutor
    describe('when user is already a tutor', function() {
      // Add fake user and call make it a tutir
      beforeAll(function(done) {
        connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
          if (!!err) console.log(err);
          connection.query('INSERT INTO tutor SET ?', [{userID: fakeUser.userID}], function(err) {
            if (!!err) console.log(err);
            done();
          });
        });
      });

      // Clean up after test
      afterAll(function(done) {
        connection.query('DELETE FROM tutor WHERE userID = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
            if (!!err) console.log(err);
            done();
          });
        });
      });

      // Try calling function anyway
      beforeEach(function(done) {
        connection.query('CALL upgradeToTutor(?)', [fakeUser.userID], function(err) {
          if (!!err) errorFlag = true;
          done();
        });
      });

      // Check user is still there
      it('should result in only one tutor', function(done) {
        connection.query('SELECT COUNT(*) FROM tutor WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var isTutor = rows[0]['COUNT(*)'];
          expect(isTutor).toBe(1);
          done();
        });
      });
    });

  });


  // ---------------------------------------- //
  // assignUnitTutored(userID, unit)
  describe('assignUnitTutored(userID, unit)', function() {

    // Situation 1: normal insert
    describe('when user and unit exist', function() {
      var myUnit = 'MATH1001';

      // Insert fake user as tutor and then call function
      beforeAll(function(done) {
        connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
          if (!!err) console.log(err);
          connection.query('INSERT INTO tutor SET ?', [{userID: fakeUser.userID}], function(err) {
            if (!!err) console.log(err);
            connection.query('CALL assignUnitTutored(?, ?)', [fakeUser.userID, myUnit], function(err) {
              if (!!err) console.log(err);
              done();
            });
          });
        });
      });

      // Clean up when done
      afterAll(function(done) {
        connection.query('DELETE FROM unitTutored WHERE tutor = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          connection.query('DELETE FROM tutor WHERE userID = ?', [fakeUser.userID], function(err) {
            if (!!err) console.log(err);
            connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
              if (!!err) console.log(err);
              done();
            });
          });
        });
      });

      // Check if row was put in table
      it('should insert into database', function(done) {
        connection.query('SELECT * FROM unitTutored WHERE tutor = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var returnedUnit = rows[0].unit;
          expect(returnedUnit).toBe(myUnit);
          done();
        });
      });

    });

    // Situation 2: user doesn't exist
    describe('when user doesn\'t exist', function() {
      var errorFlag = false;
      var myUnit = 'MATH1001';

      // Call function
      beforeAll(function(done) {
        connection.query('CALL assignUnitTutored(?, ?)', [fakeUser.userID, myUnit], function(err) {
          if (!!err) errorFlag = true;
          done();
        });
      });

      // Check mysql error was thrown
      it('should throw mysql error', function() {
        expect(errorFlag).toBe(true);
      });

      // Check nothing was added to table
      it('should not have added row', function(done) {
        connection.query('SELECT COUNT(*) FROM unitTutored WHERE tutor = ?', [fakeUser.userID], function(err, rows, fields) {
          var numUnitsTutored = rows[0]['COUNT(*)'];
          expect(numUnitsTutored).toBe(0);
          done();
        });
      });
    });

    // Situation 3: unit doesn't exist
    describe('when unit doesn\'t exist', function() {
      var errorFlag = false;
      var badUnit = 'BAD_UNIT';

      // Insert fake user as tutor and then call function
      beforeAll(function(done) {
        connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
          if (!!err) console.log(err);
          connection.query('INSERT INTO tutor SET ?', [{userID: fakeUser.userID}], function(err) {
            if (!!err) console.log(err);
            connection.query('CALL assignUnitTutored(?, ?)', [fakeUser.userID, badUnit], function(err) {
              if (!!err) errorFlag = true;
              done();
            });
          });
        });
      });

      // Clean up when done
      afterAll(function(done) {
        connection.query('DELETE FROM unitTutored WHERE tutor = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          connection.query('DELETE FROM tutor WHERE userID = ?', [fakeUser.userID], function(err) {
            if (!!err) console.log(err);
            connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
              if (!!err) console.log(err);
              done();
            });
          });
        });
      });

      // Check mysql error was thrown
      it('should throw mysql error', function() {
        expect(errorFlag).toBe(true);
      });

      // Check nothing was added to table
      it('should not have added row', function(done) {
        connection.query('SELECT COUNT(*) FROM unitTutored WHERE tutor = ?', [fakeUser.userID], function(err, rows, fields) {
          var numUnitsTutored = rows[0]['COUNT(*)'];
          expect(numUnitsTutored).toBe(0);
          done();
        });
      });
    });

    // Situation 4: double insert
    describe('when attempting to insert duplicate row', function() {
      var errorFlag = false;
      var myUnit = 'MATH1001';

      // Insert fake user as tutor and then call function
      beforeAll(function(done) {
        connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
          if (!!err) console.log(err);
          connection.query('INSERT INTO tutor SET ?', [{userID: fakeUser.userID}], function(err) {
            if (!!err) console.log(err);
            connection.query('INSERT INTO unitTutored (tutor, unit) VALUES (?, ?)', [fakeUser.userID, myUnit], function(err) {
              if (!!err) console.log(err);
              connection.query('CALL assignUnitTutored(?, ?)', [fakeUser.userID, myUnit], function(err) {
                if (!!err) errorFlag = true;
                done();
              });
            });
          });
        });
      });

      // Clean up when done
      afterAll(function(done) {
        connection.query('DELETE FROM unitTutored WHERE tutor = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          connection.query('DELETE FROM tutor WHERE userID = ?', [fakeUser.userID], function(err) {
            if (!!err) console.log(err);
            connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
              if (!!err) console.log(err);
              done();
            });
          });
        });
      });

      // Check error was thrown
      it('should throw mysql error', function() {
        expect(errorFlag).toBe(true);
      });

      // Check no extra rows were added
      it('should not have added row', function(done) {
        connection.query('SELECT COUNT(*) FROM unitTutored WHERE tutor = ?', [fakeUser.userID], function(err, rows, fields) {
          var numUnitsTutored = rows[0]['COUNT(*)'];
          expect(numUnitsTutored).toBe(1);
          done();
        });
      });
    });

  });


  // ---------------------------------------- //
  // assignLanguageTutored(userID, language)
  describe('assignLanguageTutored(userID, language)', function() {

    // Situation 1: normal insert
    describe('when user and language exist', function() {
      var myLang = 'fr';

      // Insert fake user as tutor and then call function
      beforeAll(function(done) {
        connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
          if (!!err) console.log(err);
          connection.query('INSERT INTO tutor SET ?', [{userID: fakeUser.userID}], function(err) {
            if (!!err) console.log(err);
            connection.query('CALL assignLanguageTutored(?, ?)', [fakeUser.userID, myLang], function(err) {
              if (!!err) console.log(err);
              done();
            });
          });
        });
      });

      // Clean up when done
      afterAll(function(done) {
        connection.query('DELETE FROM languageTutored WHERE tutor = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          connection.query('DELETE FROM tutor WHERE userID = ?', [fakeUser.userID], function(err) {
            if (!!err) console.log(err);
            connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
              if (!!err) console.log(err);
              done();
            });
          });
        });
      });

      // Check if row was put in table
      it('should insert into database', function(done) {
        connection.query('SELECT * FROM languageTutored WHERE tutor = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var returnedLang = rows[0].language;
          expect(returnedLang).toBe(myLang);
          done();
        });
      });

    });

    // Situation 2: user doesn't exist
    describe('when user doesn\'t exist', function() {
      var errorFlag = false;
      var myLang = 'MATH1001';

      // Call function
      beforeAll(function(done) {
        connection.query('CALL assignLanguageTutored(?, ?)', [fakeUser.userID, myLang], function(err) {
          if (!!err) errorFlag = true;
          done();
        });
      });

      // Check mysql error was thrown
      it('should throw mysql error', function() {
        expect(errorFlag).toBe(true);
      });

      // Check nothing was added to table
      it('should not have added row', function(done) {
        connection.query('SELECT COUNT(*) FROM languageTutored WHERE tutor = ?', [fakeUser.userID], function(err, rows, fields) {
          var numLangTutored = rows[0]['COUNT(*)'];
          expect(numLangTutored).toBe(0);
          done();
        });
      });
    });

    // Situation 3: language doesn't exist
    describe('when language doesn\'t exist', function() {
      var errorFlag = false;
      var badLang = 'qq';

      // Insert fake user as tutor and then call function
      beforeAll(function(done) {
        connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
          if (!!err) console.log(err);
          connection.query('INSERT INTO tutor SET ?', [{userID: fakeUser.userID}], function(err) {
            if (!!err) console.log(err);
            connection.query('CALL assignLanguageTutored(?, ?)', [fakeUser.userID, badLang], function(err) {
              if (!!err) errorFlag = true;
              done();
            });
          });
        });
      });

      // Clean up when done
      afterAll(function(done) {
        connection.query('DELETE FROM languageTutored WHERE tutor = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          connection.query('DELETE FROM tutor WHERE userID = ?', [fakeUser.userID], function(err) {
            if (!!err) console.log(err);
            connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
              if (!!err) console.log(err);
              done();
            });
          });
        });
      });

      // Check mysql error was thrown
      it('should throw mysql error', function() {
        expect(errorFlag).toBe(true);
      });

      // Check nothing was added to table
      it('should not have added row', function(done) {
        connection.query('SELECT COUNT(*) FROM languageTutored WHERE tutor = ?', [fakeUser.userID], function(err, rows, fields) {
          var numLangTutored = rows[0]['COUNT(*)'];
          expect(numLangTutored).toBe(0);
          done();
        });
      });
    });

    // Situation 4: double insert
    describe('when attempting to insert duplicate row', function() {
      var errorFlag = false;
      var myLang = 'fr';

      // Insert fake user as tutor and then call function
      beforeAll(function(done) {
        connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
          if (!!err) console.log(err);
          connection.query('INSERT INTO tutor SET ?', [{userID: fakeUser.userID}], function(err) {
            if (!!err) console.log(err);
            connection.query('INSERT INTO languageTutored (tutor, language) VALUES (?, ?)', [fakeUser.userID, myLang], function(err) {
              if (!!err) console.log(err);
              connection.query('CALL assignLanguageTutored(?, ?)', [fakeUser.userID, myLang], function(err) {
                if (!!err) errorFlag = true;
                done();
              });
            });
          });
        });
      });

      // Clean up when done
      afterAll(function(done) {
        connection.query('DELETE FROM languageTutored WHERE tutor = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          connection.query('DELETE FROM tutor WHERE userID = ?', [fakeUser.userID], function(err) {
            if (!!err) console.log(err);
            connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
              if (!!err) console.log(err);
              done();
            });
          });
        });
      });

      // Check error was thrown
      it('should throw mysql error', function() {
        expect(errorFlag).toBe(true);
      });

      // Check no extra rows were added
      it('should not have added row', function(done) {
        connection.query('SELECT COUNT(*) FROM languageTutored WHERE tutor = ?', [fakeUser.userID], function(err, rows, fields) {
          var numLangTutored = rows[0]['COUNT(*)'];
          expect(numLangTutored).toBe(1);
          done();
        });
      });
    });

  });


  // ---------------------------------------- //
  // getPasswordHashAndSalt(userID)
  describe('getPasswordHashAndSalt(userID)', function() {

    // Case 1: user exists
    describe('when user exists', function() {
      beforeAll(function(done) {
        connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
          if (!!err) console.log(err);
          done();
        });
      });

      afterAll(function(done) {
        connection.query('DELETE FROM user WHERE userID =  ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          done();
        });
      });

      it('should return one row with correct info', function(done) {
        connection.query('CALL getPasswordHashAndSalt(?)', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var hash = rows[0][0].hash;
          var salt = rows[0][0].salt;
          expect(rows[0].length).toBe(1);
          expect(hash).toBe(fakeUser.passwordHash);
          expect(salt).toBe(fakeUser.passwordSalt);
          done();
        });
      });
    });

    // Case2: user doesn't exist
    describe('when user doen\'t exists', function() {
      it('should return zero rows', function(done) {
        connection.query('CALL getPasswordHashAndSalt(?)', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          expect(rows[0].length).toBe(0);
          done();
        });
      });
    });

  });


  // ---------------------------------------- //
  // getAccountStatus(userID)
  describe('getAccountStatus(userID)', function() {
    beforeAll(function(done) {
      connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
        if (!!err) console.log(err);
        done();
      });
    });

    afterAll(function(done) {
      connection.query('DELETE FROM user WHERE userID =  ?', [fakeUser.userID], function(err) {
        if (!!err) console.log(err);
        done();
      });
    });

    // case 1: user is not email verified
    describe('when user is not email verified', function() {
      it('should have 0 entry for isEmailVerified', function(done) {
        connection.query('CALL getAccountStatus(?)', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var isEmailVerified = rows[0][0].isEmailVerified;
          expect(isEmailVerified).toBe(0);
          done();
        });
      });
    });

    // case 2: user is email verified
    describe('when user is email verified', function() {
      beforeAll(function(done) {
        connection.query('UPDATE user SET emailVerified = 1 WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          done();
        });
      });

      afterAll(function(done) {
        connection.query('UPDATE user SET emailVerified = 1 WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          done();
        });
      });

      it('should have 1 entry for isEmailVerified', function(done) {
        connection.query('CALL getAccountStatus(?)', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var isEmailVerified = rows[0][0].isEmailVerified;
          expect(isEmailVerified).toBe(1);
          done();
        });
      });
    });

    // case 3: user is not banned
    describe('when user is not banned', function() {
      it('should have 0 entry for isBanned', function(done) {
        connection.query('CALL getAccountStatus(?)', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var isBanned = rows[0][0].isBanned;
          expect(isBanned).toBe(0);
          done();
        });
      });
    });

    // case 4: user is banned
    describe('when user is banned', function() {
      beforeAll(function(done) {
        connection.query('INSERT INTO bannedUser SET userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          done();
        });
      });

      afterAll(function(done) {
        connection.query('DELETE FROM bannedUser WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          done();
        });
      });

      it('should have 1 entry for isBanned', function(done) {
        connection.query('CALL getAccountStatus(?)', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var isBanned = rows[0][0].isBanned;
          expect(isBanned).toBe(1);
          done();
        });
      });
    });

    // case 5: user is not a tutor
    describe('when user is not a tutor', function() {
      it('should have 0 entry for isTutor', function(done) {
        connection.query('CALL getAccountStatus(?)', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var isTutor= rows[0][0].isTutor;
          expect(isTutor).toBe(0);
          done();
        });
      });
    });

    // case 6: user is tutor but not vetted
    describe('when user is a tutor but not yet vetted', function() {
      beforeAll(function(done) {
        connection.query('INSERT INTO tutor SET userID = ?, verified = 0', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          done();
        });
      });

      afterAll(function(done) {
        connection.query('DELETE FROM tutor WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          done();
        });
      });

      it('should have 1 entry for isBanned', function(done) {
        connection.query('CALL getAccountStatus(?)', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var isTutor = rows[0][0].isTutor;
          var isVetted = rows[0][0].isVetted;
          expect(isTutor).toBe(1);
          expect(isVetted).toBe(0);
          done();
        });
      });
    });

    // case 7: user is tutor and vetted
    describe('when user is a tutor and vetted', function() {
      beforeAll(function(done) {
        connection.query('INSERT INTO tutor SET userID = ?, verified = 1', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          done();
        });
      });

      afterAll(function(done) {
        connection.query('DELETE FROM tutor WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          done();
        });
      });

      it('should have 1 entry for isBanned', function(done) {
        connection.query('CALL getAccountStatus(?)', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var isTutor = rows[0][0].isTutor;
          var isVetted = rows[0][0].isVetted;
          expect(isTutor).toBe(1);
          expect(isVetted).toBe(1);
          done();
        });
      });
    });

  });


  // ---------------------------------------- //
  // getProfile(userID)
  describe('getProfile(userID)', function() {

    // Case 1: user is a student
    describe('when user is a student', function() {
      beforeAll(function(done) {
        connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
          if (!!err) console.log(err);
          done();
        });
      });

      afterAll(function(done) {
        connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          done();
        });
      });

      it('should return correct user profile', function(done) {
        connection.query('CALL getProfile(?)', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var details = rows[0][0];
          expect(details.userID).toBe(fakeUser.userID);
          expect(details.firstName).toBe(fakeUser.firstName);
          expect(details.lastName).toBe(fakeUser.lastName);
          expect(Date(details.DOB)).toBe(Date(fakeUser.DOB));
          expect(details.sex).toBe(fakeUser.sex);
          expect(details.phone).toBe(fakeUser.phone);
          done();
        });
      });

      it('should return null on tutor fields', function(done) {
        connection.query('CALL getProfile(?)', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var details = rows[0][0];
          expect(details.bio).toBe(null);
          expect(details.visible).toBe(null);
          done();
        });
      });
    });

    // Case 2: user is a tutor
    describe('when user is a tutor', function() {
      var bio = 'bio';
      var visible = 1;

      beforeAll(function(done) {
        connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
          if (!!err) console.log(err);
          connection.query('INSERT INTO tutor SET userID = ?, bio = ?, visible = ?', [fakeUser.userID, bio, visible], function(err) {
            if (!!err) console.log(err);
            done();
          });
        });
      });

      afterAll(function(done) {
        connection.query('DELETE FROM tutor WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
            if (!!err) console.log(err);
            done();
          });
        });
      });

      it('should return correct user profile', function(done) {
        connection.query('CALL getProfile(?)', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var details = rows[0][0];
          expect(details.userID).toBe(fakeUser.userID);
          expect(details.firstName).toBe(fakeUser.firstName);
          expect(details.lastName).toBe(fakeUser.lastName);
          expect(Date(details.DOB)).toBe(Date(fakeUser.DOB));
          expect(details.sex).toBe(fakeUser.sex);
          expect(details.phone).toBe(fakeUser.phone);
          done();
        });
      });

      it('should return correct tutor details', function(done) {
        connection.query('CALL getProfile(?)', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var details = rows[0][0];
          expect(details.bio).toBe(bio);
          expect(details.visible).toBe(visible);
          done();
        });
      });
    });

    // Case 3: user doesn't exist
    describe('when user does not exist', function() {
      it('should return zero rows', function(done) {
        connection.query('CALL getProfile(?)', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          expect(rows[0].length).toBe(0);
          done();
        });
      });
    });

  });


  // ---------------------------------------- //
  // getTutoredUnits(userID)
  describe('getTutoredUnits(userID)', function() {
    var myUnits = ['MATH1001', 'MATH1002'];

    beforeAll(function(done) {
      connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
        if (!!err) console.log(err);
        connection.query('INSERT INTO tutor SET userID = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          connection.query('INSERT INTO unitTutored VALUES (?, ?), (?, ?)', [fakeUser.userID, myUnits[0], fakeUser.userID, myUnits[1]], function(err) {
            if (!!err) console.log(err);
            done();
          });
        });
      });
    });

    afterAll(function(done) {
      connection.query('DELETE FROM unitTutored WHERE tutor = ?', [fakeUser.userID], function(err, rows, fields) {
        if (!!err) console.log(err);
        connection.query('DELETE FROM tutor WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
            if (!!err) console.log(err);
            done();
          });
        });
      });
    });

    it('should return list of units tutored', function(done) {
      connection.query('CALL getTutoredUnits(?)', [fakeUser.userID], function(err, rows, fields) {
        if (!!err) console.log(err);
        var units = rows[0];
        expect(units[0].unitID).toBe(myUnits[0]);
        expect(units[1].unitID).toBe(myUnits[1]);
        done();
      });
    });

  });


  // ---------------------------------------- //
  // getTutoredLanguages(userID)
  describe('getTutoredLanguages(userID)', function() {
    var myLangs = ['es', 'fr'];

    beforeAll(function(done) {
      connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
        if (!!err) console.log(err);
        connection.query('INSERT INTO tutor SET userID = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          connection.query('INSERT INTO languageTutored VALUES (?, ?), (?, ?)', [fakeUser.userID, myLangs[0], fakeUser.userID, myLangs[1]], function(err) {
            if (!!err) console.log(err);
            done();
          });
        });
      });
    });

    afterAll(function(done) {
      connection.query('DELETE FROM languageTutored WHERE tutor = ?', [fakeUser.userID], function(err, rows, fields) {
        if (!!err) console.log(err);
        connection.query('DELETE FROM tutor WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
            if (!!err) console.log(err);
            done();
          });
        });
      });
    });

    it('should return list of languages tutored', function(done) {
      connection.query('CALL getTutoredLanguages(?)', [fakeUser.userID], function(err, rows, fields) {
        if (!!err) console.log(err);
        var langs = rows[0];
        expect(langs[0].languageCode).toBe(myLangs[0]);
        expect(langs[1].languageCode).toBe(myLangs[1]);
        done();
      });
    });

  });


  // ---------------------------------------- //
  // updateUser(userID, firstName, lastName, DOB, sex, phone)
  describe('updateUser(userID, firstName, lastName, DOB, sex, phone)', function() {
    var updatedUser = {
      userID: fakeUser.userID,
      firstName: 'Jane',
      lastName: 'Smithe',
      DOB: '1990-01-02',
      sex: 'F',
      phone: '0432000112',
    };

    // case 1: user exists
    describe('when user exists', function() {
      var errorFlag = false;

      beforeAll(function(done) {
        connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
          if (!!err) console.log(err);
          connection.query('CALL updateUser(?, ?, ?, ?, ?, ?)', [updatedUser.userID, updatedUser.firstName, updatedUser.lastName, updatedUser.DOB, updatedUser.sex, updatedUser.phone], function(err) {
            if (!!err) console.log(err);
            done();
          });
        });
      });

      afterAll(function(done) {
        connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          done();
        });
      });

      it('should update database appropriately', function(done) {
        connection.query('SELECT * FROM user WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var profile = rows[0];
          expect(profile.firstName).toBe(updatedUser.firstName);
          expect(profile.lastName).toBe(updatedUser.lastName);
          expect(Date(profile.DOB)).toBe(Date(updatedUser.DOB));
          expect(profile.sex).toBe(updatedUser.sex);
          expect(profile.phone).toBe(updatedUser.phone);
          done();
        });
      });
    });

    // case 2: user doesn't exist
    describe('when user does not exist', function() {
      var errorFlag = false;

      beforeAll(function(done) {
        connection.query('CALL updateUser(?, ?, ?, ?, ?, ?)', [updatedUser.userID, updatedUser.firstName, updatedUser.lastName, updatedUser.DOB, updatedUser.sex, updatedUser.phone], function(err) {
          if (!!err) errorFlag = true;
          done();
        });
      });

      it('should not throw a mysql error', function() {
        expect(errorFlag).toBe(false);
      });

      it('should not have added a user', function(done) {
        connection.query('SELECT COUNT(*) FROM user WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          expect(rows[0]['COUNT(*)']).toBe(0);
          done();
        });
      });
    });

  });


  // ---------------------------------------- //
  // updateTutorProfile(userID, bio, visible)
  describe('updateTutorProfile(userID, bio, visible)', function() {
    var oldBio = 'old bio';
    var oldVisible = 0;

    var newBio = 'new bio';
    var newVisible = 1;

    beforeAll(function(done) {
      connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
        if (!!err) console.log(err);
        done();
      });
    });

    afterAll(function(done) {
      connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
        if (!!err) console.log(err);
        done();
      });
    });


    // case 1: user is tutor
    describe('when user is a tutor', function() {
      beforeAll(function(done) {
        connection.query('INSERT INTO tutor SET userID = ?, bio = ?, visible = ?', [fakeUser.userID, oldBio, oldVisible], function(err) {
          if (!!err) console.log(err);
          connection.query('CALL updateTutorProfile(?, ?, ?)', [fakeUser.userID, newBio, newVisible], function(err) {
            if (!!err) console.log(err);
            done();
          });
        });
      });

      afterAll(function(done) {
        connection.query('DELETE FROM tutor WHERE userID = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          done();
        });
      });

      it('should update tutor details', function(done) {
        connection.query('SELECT * FROM tutor WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          var bio = rows[0].bio;
          var visible = rows[0].visible;
          expect(bio).toBe(newBio);
          expect(visible).toBe(newVisible);
          done();
        });
      });
    });

    // case 2: user is not a tutor
    describe('when user is not a tutor', function() {
      var errorFlag = false;

      beforeAll(function(done) {
        connection.query('CALL updateTutorProfile(?, ?, ?)', [fakeUser.userID, newBio, newVisible], function(err) {
          if (!!err) errorFlag = true;
          done();
        });
      });

      it('should not throw an error', function() {
        expect(errorFlag).toBe(false);
      });

      it('should not upgrade user to tutor', function(done) {
        connection.query('SELECT COUNT(*) FROM tutor WHERE userID = ?', [fakeUser.userID], function(err, rows, fields) {
          if (!!err) console.log(err);
          expect(rows[0]['COUNT(*)']).toBe(0);
          done();
        });
      });
    });

  });


  // ---------------------------------------- //
  // removeUnitTutored(userID, unit)
  describe('removeUnitTutored(userID, unit)', function() {
    var myUnits = ['MATH1001', 'MATH1002'];

    beforeAll(function(done) {
      connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
        if (!!err) console.log(err);
        connection.query('INSERT INTO tutor SET userID = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          connection.query('INSERT INTO unitTutored VALUES (?, ?), (?, ?)', [fakeUser.userID, myUnits[0], fakeUser.userID, myUnits[1]], function(err) {
            if (!!err) console.log(err);
            connection.query('CALL removeUnitTutored(?, ?)', [fakeUser.userID, myUnits[0]], function(err) {
              if (!!err) console.log(err);
              done();
            });
          });
        });
      });
    });

    afterAll(function(done) {
      connection.query('DELETE FROM unitTutored WHERE tutor = ?', [fakeUser.userID], function(err) {
        if (!!err) console.log(err);
        connection.query('DELETE FROM tutor WHERE userID = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
            if (!!err) console.log(err);
            done();
          });
        });
      });
    });

    it('unit list should now have ' + myUnits.length -1 + ' units', function(done) {
      connection.query('SELECT COUNT(*) FROM unitTutored WHERE tutor = ?', [fakeUser.userID], function(err, rows, fields) {
        if (!!err) console.log(err);
        expect(rows[0]['COUNT(*)']).toBe(myUnits.length -1);
        done();
      });
    });

    it('should return the non-deleted unit', function(done) {
      connection.query('SELECT unit FROM unitTutored WHERE tutor = ?', [fakeUser.userID], function(err, rows, fields) {
        if (!!err) console.log(err);
        expect(rows[0].unit).toBe(myUnits[1]);
        done();
      });
    });
  });


  // ---------------------------------------- //
  // removeLanguageTutored(userID, language)
  describe('removeLanguageTutored(userID, language)', function() {
    var myLangs = ['fr', 'es'];

    beforeAll(function(done) {
      connection.query('INSERT INTO user SET ?', [fakeUser], function(err) {
        if (!!err) console.log(err);
        connection.query('INSERT INTO tutor SET userID = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          connection.query('INSERT INTO languageTutored VALUES (?, ?), (?, ?)', [fakeUser.userID, myLangs[0], fakeUser.userID, myLangs[1]], function(err) {
            if (!!err) console.log(err);
            connection.query('CALL removeLanguageTutored(?, ?)', [fakeUser.userID, myLangs[0]], function(err) {
              if (!!err) console.log(err);
              done();
            });
          });
        });
      });
    });

    afterAll(function(done) {
      connection.query('DELETE FROM languageTutored WHERE tutor = ?', [fakeUser.userID], function(err) {
        if (!!err) console.log(err);
        connection.query('DELETE FROM tutor WHERE userID = ?', [fakeUser.userID], function(err) {
          if (!!err) console.log(err);
          connection.query('DELETE FROM user WHERE userID = ?', [fakeUser.userID], function(err) {
            if (!!err) console.log(err);
            done();
          });
        });
      });
    });

    it('unit list should now have ' + myLangs.length -1 + ' languages', function(done) {
      connection.query('SELECT COUNT(*) FROM languageTutored WHERE tutor = ?', [fakeUser.userID], function(err, rows, fields) {
        if (!!err) console.log(err);
        expect(rows[0]['COUNT(*)']).toBe(myLangs.length -1);
        done();
      });
    });

    it('should return the non-deleted unit', function(done) {
      connection.query('SELECT language FROM languageTutored WHERE tutor = ?', [fakeUser.userID], function(err, rows, fields) {
        if (!!err) console.log(err);
        expect(rows[0].language).toBe(myLangs[1]);
        done();
      });
    });
  });

});

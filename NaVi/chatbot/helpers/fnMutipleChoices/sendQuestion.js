'use strict';
const
    mongoose = require('mongoose'),
    models = require('../../models');

module.exports = function (recipientId) {
    models.User.findOne({
        facebookId: recipientId
    }, function (err, user) {
        if (!user) {
            console.log('User does not exist yet!');
            createNewUserWithQuestions(recipientId);
        }
        else {
            if (user.unlearnedQuestions.length == 0) {
                require('../sendConfusionMessage')(recipientId);
            }
            else {
                getOneQuestion(user.unlearnedQuestions, recipientId);
            }
        }
    });

    function createNewUserWithQuestions(recipientId) {
        models.Question.find({}, function(err, questions) {
            if (questions) {
                var ids = [];
                for (var i=0; i < questions.length; i++) {
                    ids.push({questionId: questions[i]._id});
                }
                console.log("Creating unlearned question set for new user.");
                models.User.create({
                    facebookId: recipientId,
                    unlearnedQuestions: ids
                }, function (err) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        getOneQuestion(ids, recipientId);
                    }
                });
            }
        });
    };

    function getOneQuestion(unlearnedQuestion, recipientId) {
        if (unlearnedQuestion.length == 0) {
            let errorText = "Xin lỗi. Mình chưa thể tìm thấy câu hỏi trắc nghiệm nào cho bạn.";
            require('../sendErrorMessage')(recipientId, errorText);
        } else {
            // get a random question in unlearned question set
            var idx = Math.floor(Math.random() * unlearnedQuestion.length);
            var qs = unlearnedQuestion[idx];
            models.Question.findOne({
                _id: qs.questionId
            }, function (err, question) {
                // append question's id to payload to know which question the user
                // answered to later
                var mcTrue = "MC_TRUE_" + question._id;
                var mcFalse = "MC_FALSE_" + question._id;

                var messageData = {
                    recipient: {
                        id: recipientId
                    },
                    message: {
                        text: question.question,
                        quick_replies: [
                            {
                                "content_type":"text",
                                "title": 'A. '+ question.choices[0].text,
                                "payload": question.choices[0].isAnswer ? mcTrue : mcFalse
                            },
                            {
                                "content_type":"text",
                                "title": 'B. '+ question.choices[1].text,
                                "payload": question.choices[1].isAnswer ? mcTrue : mcFalse
                            },
                            {
                                "content_type":"text",
                                "title": 'C. '+ question.choices[2].text,
                                "payload": question.choices[2].isAnswer ? mcTrue : mcFalse
                            }
                        ]
                    }
                };

                require('../facebook/sendFunctions/callSendAPI')(messageData);
            });
        }
    };
};
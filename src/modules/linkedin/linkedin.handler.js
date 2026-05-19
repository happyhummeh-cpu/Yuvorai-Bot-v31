const { Markup } = require('telegraf');



async function linkedinRoastStart(ctx) {



  try {



    ctx.session = ctx.session || {};



    ctx.session.linkedinRoast = {

      awaitingPhoto: true,

      startedAt: Date.now()

    };



    await ctx.reply(

      'Ì†ΩÌ≥∏ Send your LinkedIn screenshot',

      Markup.inlineKeyboard([

        [

          Markup.button.callback(

            '‚ùå Cancel',

            'linkedin_roast_cancel'

          )

        ]

      ])

    );



  } catch (err) {



    console.log(err);



  }



}



async function handleLinkedInPhoto(ctx) {



  try {



    if (

      !ctx.session ||

      !ctx.session.linkedinRoast ||

      !ctx.session.linkedinRoast.awaitingPhoto

    ) {

      return;

    }



    if (!ctx.message.photo) {



      return ctx.reply('‚ùå No photo');



    }



    const photo =

      ctx.message.photo[

        ctx.message.photo.length - 1

      ];



    console.log(

      'PHOTO RECEIVED:',

      photo.file_id

    );



    await ctx.reply(

      'Ì†ΩÌ¥• Screenshot received successfully'

    );



    delete ctx.session.linkedinRoast;



  } catch (err) {



    console.log(err);



    await ctx.reply(

      '‚ùå Error processing screenshot'

    );



  }



}



module.exports = {

  linkedinRoastStart,

  handleLinkedInPhoto

};

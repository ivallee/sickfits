const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');

const { transport, template } = require('../mail');

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: check for login

    const item = await ctx.db.mutation.createItem(
      {
        data: {
          ...args,
        },
      },
      info
    );
    return item;
  },
  updateItem(parent, args, ctx, info) {

    const updates = { ...args };
    delete updates.id;

    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id,
        },
      },
      info
    );
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    const item = await ctx.db.query.item({ where }, `{ id title }`);

    return ctx.db.mutation.deleteItem({ where }, info);
  },
  async signup(parent, args, ctx, info) {

     args.email = args.email.toLowerCase();

     const password = await bcrypt.hash(args.password, 10);

     const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ['USER'] },
       }
      }, info
    );
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {

    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No user found for email ${email}`);
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid Password');
    }
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token');
    return { message: 'Goodbye!' };
  },
  async requestReset(parent, { email }, ctx, info) {

    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No user found for email ${email}`);
    }

    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000;

    const res = await ctx.db.mutation.updateUser(
      {
        where: { email },
        data: { resetToken, resetTokenExpiry },
      },
    );

    const emailres = await transport.sendMail({
      from: 'isaac@sickfits.com',
      to: user.email,
      subject: 'Your Password Reset Token',
      html: template(`
        Your password reset token is here!
        \n\n 
        You have 1 hour to use it. Click <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">here</a> to reset your password`),
    });

    return { message: 'Success!'};
  },
  async resetPassword(parent, args, ctx, info) {
    // 1. Check if passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error('Passwords did not match');
    }
    // 2. Check if the reset token is legit
    const [user] = await ctx.db.query.users({ 
        where: { 
          resetToken: args.resetToken,
          resetTokenExpiry_gte: Date.now() - 3600000,
        } 
    });

    if (!user) {
      throw new Error(`Your token is either invalid or expired`);
    }

    // 4. Hash the new password
    const password = await bcrypt.hash(args.password, 10);
    // 5. Save the new password to the user and remove old resetToken fields
    const updatedUser = await ctx.db.mutation.updateUser(
      {
        where: { email: user.email },
        data: {
          password,
          resetToken: null,
          resetTokenExpiry: null,
        },
      },
    );
    // 6. generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // 7. set JWT cooki
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    // 8. return user
    return updatedUser;
  },
};

module.exports = Mutations;

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');

const { transport, template } = require('../mail');
const { hasPermission } = require('../utils');

const Mutations = {
  async createItem(parent, args, ctx, info) {
    
    if (!ctx.request.userId) {
      throw new Error('You must be logged in to do that');
    }
    
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          user: {
            connect: {
              id: ctx.request.userId,
            }
          },
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
    const item = await ctx.db.query.item({ where }, `{ id title user { name id } }`);

    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermission = ctx.request.user.permissions.some(permission => ['ADMIN', 'DELETEITEM'].includes(permission));
    
    if (!ownsItem || !hasPermission) {
      throw new Error('You do not have permission to delete that');
    }

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
  async updatePermissions(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error('You must be logged in');
    }
    const user = await ctx.db.query.user({ 
        where: { 
          id: ctx.request.userId
        } 
      },
      info,
    );

    hasPermission(user, ['ADMIN', 'PERMISSIONUPDATE']);

    return await ctx.db.mutation.updateUser({
      where: { id: args.userId },
      data: { 
        permissions: { set: args.permissions },
      }
    }, info);
  },
  async addToCart(parent, args, ctx, info) {
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error('You must be logged in');
    }
    const [existingCartItem] = await ctx.db.query.cartItems(
      {
        where: {
          user: { id: userId },
          item: { id: args.id }, 
        },
      }, 
      info
    );
    if (existingCartItem) {
      return ctx.db.mutation.updateCartItem(
        {
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + 1 },
        },
        info
      );
    }
    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: {
            connect: { id: userId },
          },
          item: {
            connect: { id: args.id },
          },
        },
      },
      info
    );
  },
  async removeFromCart(parent, args, ctx, info) {

    const cartItem = await ctx.db.query.cartItem({
      where: {
        id: args.id,
      }
    }, `{ id, user { id } }`);
    if (!cartItem) throw new Error('No item found');
    if (cartItem.user.id !== ctx.request.userId) throw new Error('Not yours!');
    
    return ctx.db.mutation.deleteCartItem({
      where: { id: args.id }
    },
    info
    );
  }
};

module.exports = Mutations;

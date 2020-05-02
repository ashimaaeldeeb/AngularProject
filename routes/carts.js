const express = require("express");
const Cart = require("../models/cart");
const User = require("../models/user");
const Product = require("../models/product");
const CheckToken = require("../midlware/Auth");
const validateObjectId = require("../helpers/validateObjectId");
const validateCart = require("../helpers/validateCart");

const router = express.Router();

//Get User's Cart
router.get("/user/:id", CheckToken, async (req, res) => {
  const id = req.params.id;
  const { error } = validateObjectId(req.params.id);
  if (error) return res.status(400).send("User id is not valid");
  const cart = await Cart.find({
    userId: id
  });
  console.log(cart);
  if (!cart) return res.status(404).send("Cart is not found for this user.");
  res.status(200).send(cart);
});

//Post product to user's cart
router.post("/user/:id", [CheckToken, validateCart], async (req, res) => {
  const { error } = validateObjectId(req.params.id);
  if (error) return res.status(400).send("User id is not valid");

  const user = await User.findById(req.params.id);
  if (!user) return res.status(400).send("User is not found");

  const userCart = await Cart.findById(user.cart); //elcart beta3t eluser dah
  if (!userCart) return res.status(400).send("User's cart is not found");

  const product = await Product.findById(req.body.productsList[0].productId);
  if (!product) return res.status(400).send("Product is not found");

  const indexFound = userCart.productsList.findIndex(item => {
    return item.productId == req.body.productsList[0].productId;
  });

  if (indexFound !== -1 && product.quantity >= 0) {
    //here
    if (product.quantity - req.body.productsList[0].quantity >= 0) {
      //available enough qty
      userCart.productsList[indexFound].quantity = //plus in userCart
        userCart.productsList[indexFound].quantity +
        req.body.productsList[0].quantity;
      product.quantity = product.quantity - req.body.productsList[0].quantity; //minus in products
    } else {
      //products < desired qty
      return res.status(400).send("More than available quantity");
    }
  } else if (product.quantity > 0) {
    //not in cart yet
    if (product.quantity - req.body.productsList[0].quantity >= 0) {
      userCart.productsList.push({
        productId: req.body.productsList[0].productId,
        quantity: req.body.productsList[0].quantity
      });
      product.quantity = product.quantity - req.body.productsList[0].quantity;
    } else {
      //products < desired qty
      return res.status(400).send("More than available quantity");
    }
  }

  await userCart.save();
  await product.save();
  res.status(200).send(userCart);

  // const cart = await Cart.findOne({
  //     userId: req.params.id
  // })
  // const productInCart = {
  //     productId: req.body.productId,
  //     quantity: req.body.quantity,
  //     isDeleted: false
  // }
  // let productExist = false;
  // let totalQuantity = productInCart.quantity;
  // cart.productsList.forEach(element => {
  //     if (element.productId == productInCart.productId) {
  //         productExist = true;
  //         element.quantity = parseInt(element.quantity) + parseInt(productInCart.quantity);
  //         totalQuantity = element.quantity;
  //     }
  // });
  // if (!productExist) {
  //     cart.productsList.push(productInCart);
  // }
  // const productInStore = await Product.findById(productInCart.productId);
  // if (parseInt(totalQuantity) > parseInt(productInStore.quantity))
  //     return res.status(400).send("more than available quantity");
  //await cart.save();
  //return res.status(200).send(cart);
});

//Patch user's cart
router.patch(
  "/user/:id/product",
  [CheckToken, validateCart],
  async (req, res) => {
    const id = req.params.id;
    const { error } = validateObjectId(id);
    if (error) return res.status(400).send("User id is not valid");
    const user = await User.findById(id);
    if (!user) return res.status(404).send("User is not found");

    const cart = await Cart.findOne({
      userId: id
    });
    if (!cart) return res.status(400).send("User's cart is not found");
    const productModified = {
      productId: req.body.productId,
      quantity: req.body.quantity
      // isDeleted: req.body.isDeleted
    };
    const productInStore = await Product.findById(productModified.productId);
    if (
      productModified.quantity &&
      productModified.quantity > productInStore.quantity
    )
      return res.status(400).send("More than available quantity");

    cart.productsList.forEach(element => {
      if (element.productId == productModified.productId) {
        element.quantity = productModified.quantity
          ? productModified.quantity
          : element.quantity;
        //   element.isDeleted = productModified.isDeleted
        //     ? productModified.isDeleted
        //     : element.isDeleted;
      }
    });

    await cart.save();
    res.status(200).send(cart);
  }
);
//Delete a product is user's cart
router.delete(
  "/user/:id/product/:productId",
  [CheckToken],
  async (req, res) => {
    const { error } = validateObjectId(req.params.id);
    if (error) return res.status(400).send("User id is not valid");

    const { error2 } = validateObjectId(req.params.productId);
    if (error2) return res.status(400).send("Product id is not valid");

    const user = await User.findById(req.params.id);
    if (!user) return res.status(400).send("User is not found");

    let cart = await Cart.find({ userId: req.params.id });
    if (!cart) return res.status(400).send("User's cart is not found");

    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(400).send("Product ID is not found");

    ///console.log(cart[0].productsList);
    const indexFound = cart[0].productsList.findIndex(item => {
      return item.productId == req.params.productId;
    });
    console.log(indexFound);
    if (indexFound !== -1) {
      //found

      product.quantity =
        product.quantity + cart[0].productsList[indexFound].quantity;

      cart[0].productsList.splice(indexFound, 1);
    }
    //console.log(cart[0].productsList);

    await cart[0].save();
    await product.save();
    res.status(200).send(cart);
  }
);

//Checkout => Empty Cart
router.get(
  "/user/:id/checkout",
  [CheckToken],
  async (req, res) => {
    const { id } = req.params;
    const { error } = validateObjectId(req.params.id);
    if (error) return res.status(400).send("User id is not valid");

    const user = await User.findById(id);
    if (!user) return res.status(400).send("User is not found");

    let cart = await Cart.find({ userId: id });
    if (!cart) return res.status(400).send("User's cart is not found");

    //console.log(cart[0].productsList);

    cart[0].productsList.splice(0, cart[0].productsList.length);

    //console.log(cart[0].productsList);

    await cart[0].save();

    res.status(200).send(cart);
  }
);

module.exports = router;

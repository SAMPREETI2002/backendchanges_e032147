import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
// const {PrismaClient} = require("@prisma/client")
const prisma = new PrismaClient();
import express from "express";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  Customer,
  Invoice,
  Plan,
  PostpaidPlan,
  PrepaidPlan,
} from "../telecom-billing-system.js";
import { LinkedList } from "../LinkedList.js";
const app = express();
const PORT = 9099;
const SECRET_KEY = process.env.JWT_SECRET;

app.use(bodyParser.json());

let customers = {};

const dummyCustomers = [
  {
    id: "customer1",
    name: "Jim",
    email: "Jim@example.com",
    password: bcrypt.hashSync("password123", 8),
  },
  {
    id: "customer2",
    name: "Dwight",
    email: "Dwight@example.com",
    password: bcrypt.hashSync("password456", 8),
  },
];
const custIds = dummyCustomers.forEach((customer) => {
  customers[customer.id] = {
    ...customer,
    invoices: [],
  };
});

function verifyToken(req, res, next) {
  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(403).send('No token provided.');
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(500).send('Failed to authenticate token.');
    }
    req.customerId = decoded.id;
    next();
  });
}


app.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).send('All fields are required.');
  }

  const hashedPassword = bcrypt.hashSync(password, 8);

  try {
    const newCustomer = await prisma.customer.create({
      data: {
        customerName: name,
        customerMail: email,
        customerPhone: phone,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ id: newCustomer.customerId }, SECRET_KEY, {
      expiresIn: 86400, // 24 hours
    });

    res.status(201).send({ auth: true, token });
  } catch (error) {
    res.status(500).send('There was a problem registering the user.');
  }
});

let loggedInCustomers = [];

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password are required.');
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { customerMail: email },
    });

    if (!customer) {
      return res.status(404).send('No user found.');
    }

    const passwordIsValid = bcrypt.compareSync(password, customer.password);

    if (!passwordIsValid) {
      return res.status(401).send({ auth: false, token: null });
    }

    const token = jwt.sign({ id: customer.customerId }, SECRET_KEY, {
      expiresIn: 86400, // 24 hours
    });

    loggedInCustomers.push(customer.customerId);

    res.status(200).send({ auth: true, token });
  } catch (error) {
    res.status(500).send('There was a problem logging in.');
  }
});

// app.get('/viewInvoice',(req,res)=>{
//     const customerId = req.body
//     res.send({

//     })
// })

app.post("/generateInvoice", async (req, res) => {
  const { customerId } = req.body;

  try {
    const customer = await prisma.customer.findUnique({
      where: { customerId },
    });
    const planId = customer.customerCurrPlan;
    console.log(planId);
    const plan = await prisma.plan.findUnique({
      where: { planId },
      include: {
        prepaidPlans: true,
        postpaidPlans: true,
      },
    });

    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    if (!planId) {
      return res.status(400).send("Plan ID is required.");
    }

    let planType;
    let createdInvoice;
    if (plan.prepaidPlans.length > 0) {
      planType = "PREPAID";
      const date = new Date();
      const invoice = new Invoice(
        customer.customerName,
        customer.customerId,
        plan,
        plan.prepaidPlans[0].unitsAvailable,
        date,
        planType,
        plan.prepaidPlans[0].prepaidBalance
      );
      createdInvoice = await prisma.invoice.create({
        data: {
          invoiceId: invoice.invoiceId,
          customerName: customer.customerName,
          customerId,
          planId: plan.planId,
          units: plan.prepaidPlans[0].unitsAvailable,
          date,
          amount: plan.prepaidPlans[0].prepaidBalance,
          planType,
        },
      });
    } else if (plan.postpaidPlans.length > 0) {
      planType = "POSTPAID";
      const date = new Date();
      const invoice = new Invoice(
        customer.customerName,
        customer.customerId,
        plan,
        plan.postpaidPlans[0].unitsUsed,
        date,
        planType,
        plan.postpaidPlans[0].unitsUsed * plan.ratePerUnit
      );
      createdInvoice = await prisma.invoice.create({
        data: {
          invoiceId: invoice.invoiceId,
          customerName: customer.customerName,
          customerId,
          planId: plan.planId,
          units: plan.postpaidPlans[0].unitsUsed,
          date,
          amount: plan.postpaidPlans[0].unitsUsed * plan.ratePerUnit,
          planType,
        },
      });
    } else {
      return res.status(400).send("Invalid plan type.");
    }

    // const date = new Date();
    // const invoice = new Invoice(customer.customerName, customer.customerId, plan, units, date, planType, amount);
    // const createdInvoice = await prisma.invoice.create({
    //   data: {
    //     invoiceId:invoice.invoiceId,
    //     customerName: customer.customerName,
    //     customerId,
    //     planId: plan.planId,
    //     units,
    //     date,
    //     amount,
    //     planType
    //   },
    // });

    res.send({
      message: "Invoice generated successfully.",
      invoice: createdInvoice,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error.");
  }
});

app.post("/buyPlan", async (req, res) => {
  const { customerId, planName, planType } = req.body;

  let plan, planInstance;
  try {
    // Fetch the customer from the database
    const customer = await prisma.customer.findUnique({
      where: { customerId: customerId },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    if (planType === "PREPAID") {
      // Fetch the plan from the database
      plan = await prisma.plan.findFirst({
        where: { planName: planName },
        include: {
          prepaidPlans: true,
          postpaidPlans: false,
        },
      });

      if (plan && plan.prepaidPlans.length > 0) {
        planInstance = new PrepaidPlan(
          plan.planName,
          plan.ratePerUnit,
          plan.prepaidPlans[0].prepaidBalance,
          plan.prepaidPlans[0].unitsAvailable
        );
      }
    } else if (planType === "POSTPAID") {
      // Fetch the plan from the database
      console.log("ASDASDASD");
      plan = await prisma.plan.findFirst({
        where: { planName: planName },
        include: {
          prepaidPlans: false,
          postpaidPlans: true,
        },
      });

      if (plan && plan.postpaidPlans.length > 0) {
        planInstance = new PostpaidPlan(
          plan.planName,
          plan.ratePerUnit,
          plan.postpaidPlans[0].billingCycle,
          plan.postpaidPlans[0].unitsUsed
        );
      }
    }
    // console.log(planInstance.planName)
    // console.log(JSON.stringify(planInstance))
    if (!plan || !planInstance) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const now = new Date();
    let invoice = new Invoice(
      customer.customerName,
      customer.customerId,
      planInstance,
      0,
      now.toDateString(),
      planType
    );

    if (planType === "PREPAID") {
      invoice.units = planInstance.unitsAvailable;
      console.log(planInstance.prepaidBalance);
      // payment gateway integration to get prepaid balance
      invoice = await prisma.invoice.create({
        data: {
          invoiceId: invoice.invoiceId,
          customerName: customer.customerName,
          customerId: customer.customerId,
          planId: plan.planId,
          units: invoice.units,
          date: now,
          amount: planInstance.prepaidBalance,
          planType: planType,
        },
      });
    } else if (planType === "POSTPAID") {
      invoice.units = planInstance.unitsUsed;

      invoice = await prisma.invoice.create({
        data: {
          invoiceId: invoice.invoiceId,
          customerName: customer.customerName,
          customerId: customer.customerId,
          planId: plan.planId,
          units: invoice.units,
          date: now,
          amount: 0,
          planType: planType,
        },
      });
    }

    await prisma.customer.update({
      where: { customerId: customerId },
      data: { customerCurrPlan: plan.planId, customerType: plan.planType }, // Assuming 'plan.planId' is the unique identifier for the plan
    });

    res.status(201).json({ customer, plan, invoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/admin/addPlan", async (req, res) => {
  const { planName, ratePerUnit, planType, prepaidBalance, billingCycle } =
    req.body;

  let plan = new Plan(planName, ratePerUnit, planType);

  plan = await prisma.plan.create({
    data: {
      planId: plan.planId,
      planName: plan.planName,
      ratePerUnit: plan.ratePerUnit,
    },
  });

  if (planType === "PREPAID") {
    if (prepaidBalance === undefined) {
      return res
        .status(400)
        .json({ error: "Missing prepaidBalance for prepaid plan" });
    }

    const prepaidPlan = await prisma.prepaidPlan.create({
      data: {
        planId: plan.planId,
        unitsAvailable: prepaidBalance / ratePerUnit,
        prepaidBalance,
      },
    });

    res.status(201).json({ plan, prepaidPlan });
  } else if (planType === "POSTPAID") {
    if (!billingCycle) {
      return res
        .status(400)
        .json({ error: "Missing billingCycle for postpaid plan" });
    }

    const postpaidPlan = await prisma.postpaidPlan.create({
      data: {
        planId: plan.planId,
        unitsUsed: 0,
        billingCycle,
      },
    });

    res.status(201).json({ plan, postpaidPlan });
  } else {
    return res.status(400).json({ error: "Invalid plan type" });
  }

  // res.send({
  //         planId : plan.planId,
  //         planName: plan.planName,
  //         ratePerUnit: plan.ratePerUnit
  // })
});

app.post("/admin/addCustomer", async (req, res) => {
  const { customerName, customerMail, customerPhone } = req.body;
  let cust = new Customer(customerName, customerMail, customerPhone);
  // let cl_head = cl.insertCustomer(req.body)
  console.log(JSON.stringify(cust, null, 2));
  // let i = new Invoice(123,cl_head.obj.customerId)

  // const invoicesData = invoiceList.map(invoiceId=>({
  //     invoiceId: invoiceId,
  //     customerId: cl_head.obj.customerId
  // }))
  let dataobj = {
    data: {
      customerId: cust.customerId,
      customerName: customerName,
      customerCurrPlan: 0,
      customerMail: customerMail,
      customerPhone: customerPhone,
      customerType: "N/A",
      // invoiceList:{
      //     create: invoicesData
      // }
    },
  };
  await prisma.customer.create(dataobj);
  res.send({
    id: cust.customerId,
    name: cust.customerName,
    plan: 0,
    mail: cust.customerMail,
    phone: cust.customerPhone,
    type: "N/A",
    // invoiceList : cl_head.obj.invoiceList
  });
  console.log(cust.customerName);
  // cl.printToEnd(cl_head)
  // cl.printToEnd(cl_head)
});


app.get("/invoices", verifyToken, (req, res) => {
  const customerId = req.customerId;

  if (!customers[customerId]) {
    return res.status(404).send("Customer not found.");
  }

  res.send(customers[customerId].invoices);
});

app.get("/invoices/:invoiceId", verifyToken, (req, res) => {
  const { invoiceId } = req.params;
  const customerId = req.customerId;

  if (!customers[customerId]) {
    return res.status(404).send("Customer not found.");
  }

  const invoice = customers[customerId].invoices.find(
    (inv) => inv.invoiceId === invoiceId
  );

  if (!invoice) {
    return res.status(404).send("Invoice not found.");
  }

  res.send(invoice);
});

app.post("/payInvoice", verifyToken, (req, res) => {
  const { invoiceId } = req.body;
  const customerId = req.customerId;

  if (!customers[customerId]) {
    return res.status(404).send("Customer not found.");
  }

  const invoice = customers[customerId].invoices.find(
    (inv) => inv.invoiceId === invoiceId
  );

  if (!invoice) {
    return res.status(404).send("Invoice not found.");
  }

  if (invoice.paid) {
    return res.status(400).send("Invoice is already paid.");
  }

  invoice.paid = true;
  res.send({
    message: `Invoice ${invoiceId} for customer ${customerId} has been paid.`,
    invoice,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

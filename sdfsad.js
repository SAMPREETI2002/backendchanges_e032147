app.post('/buyPlan', async (req, res) => {
    const { customerId, planName, planType } = req.body;

    try {
        // Fetch the customer from the database
        const customer = await prisma.customer.findUnique({
            where: { customerId: customerId }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        let plan, planInstance;
        if (planType === "PREPAID") {
            // Fetch the plan from the database
            plan = await prisma.plan.findFirst({
                where: { planName: planName },
                include: {
                    prepaidPlans: true,
                    postpaidPlans: false
                }
            });

            if (plan && plan.prepaidPlans.length > 0) {
                planInstance = new PrepaidPlan(plan.planName, plan.ratePerUnit, 0, plan.prepaidPlans[0].unitsAvailable);
            }
        } else if (planType === "POSTPAID") {
            // Fetch the plan from the database
            plan = await prisma.plan.findFirst({
                where: { planName: planName },
                include: {
                    prepaidPlans: false,
                    postpaidPlans: true
                }
            });

            if (plan && plan.postpaidPlans.length > 0) {
                planInstance = new PostpaidPlan(plan.planName, plan.ratePerUnit, plan.postpaidPlans[0].billingCycle, plan.postpaidPlans[0].unitsUsed);
            }
        }

        if (!plan || !planInstance) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        const now = new Date();
        let invoice = new Invoice(customer.customerName, customer.customerId, planInstance, 0, now.toDateString());

        if (planType === "PREPAID") {
            invoice.units = planInstance.unitsAvailable;
            // payment gateway integration to get prepaid balance
        } else if (planType === "POSTPAID") {
            invoice.units = planInstance.unitsUsed;
        }

        await prisma.customer.update({
            where: { customerId: customerId },
            data: { customerCurrPlan: plan.planId } // Assuming 'plan.planId' is the unique identifier for the plan
        });

        res.status(201).json({ customer, plan, invoice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

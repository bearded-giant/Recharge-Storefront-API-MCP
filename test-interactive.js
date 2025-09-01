#!/usr/bin/env node

import { spawn } from 'child_process';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class MCPTester {
  constructor() {
    this.requestId = 1;
  }

  async start() {
    console.log('🚀 Recharge MCP Interactive Tester');
    console.log('==================================\n');
    
    await this.showMenu();
  }

  async showMenu() {
    console.log('\nAvailable test scenarios:');
    console.log('1. List all available tools');
    console.log('2. Customer lookup and info');
    console.log('3. Subscription management');
    console.log('4. Order history');
    console.log('5. Address management');
    console.log('6. Payment methods');
    console.log('7. Custom tool call');
    console.log('8. Exit\n');

    const choice = await this.prompt('Select option (1-8): ');
    
    switch(choice) {
      case '1':
        await this.listTools();
        break;
      case '2':
        await this.customerTests();
        break;
      case '3':
        await this.subscriptionTests();
        break;
      case '4':
        await this.orderTests();
        break;
      case '5':
        await this.addressTests();
        break;
      case '6':
        await this.paymentTests();
        break;
      case '7':
        await this.customCall();
        break;
      case '8':
        process.exit(0);
      default:
        console.log('Invalid option');
    }
    
    await this.showMenu();
  }

  async listTools() {
    const response = await this.sendRequest({
      method: 'tools/list',
      params: {}
    });
    
    console.log('\n📋 Available Tools:');
    response.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
  }

  async customerTests() {
    const email = await this.prompt('Enter customer email: ');
    
    console.log('\n1️⃣ Looking up customer by email...');
    const lookupResponse = await this.callTool('get_customer_by_email', { email });
    console.log('Customer ID:', lookupResponse?.customer_id);
    
    console.log('\n2️⃣ Getting customer details...');
    const customerResponse = await this.callTool('get_customer', { 
      customer_email: email 
    });
    console.log('Customer:', JSON.stringify(customerResponse, null, 2));
  }

  async subscriptionTests() {
    const email = await this.prompt('Enter customer email: ');
    
    console.log('\n📦 Getting subscriptions...');
    const response = await this.callTool('get_subscriptions', {
      customer_email: email,
      status: 'active'
    });
    
    if (response?.subscriptions?.length > 0) {
      console.log(`Found ${response.subscriptions.length} subscriptions:`);
      response.subscriptions.forEach(sub => {
        console.log(`  - ID: ${sub.id}, Product: ${sub.product_title}, Status: ${sub.status}`);
      });
      
      const action = await this.prompt('\nActions: (s)kip, (u)pdate, (c)ancel, (n)one: ');
      if (action !== 'n' && response.subscriptions[0]) {
        const subId = response.subscriptions[0].id;
        
        switch(action) {
          case 's':
            const date = await this.prompt('Skip date (YYYY-MM-DD): ');
            await this.callTool('skip_subscription', {
              customer_email: email,
              subscription_id: subId,
              date
            });
            console.log('✅ Subscription skipped');
            break;
          case 'u':
            const quantity = await this.prompt('New quantity: ');
            await this.callTool('update_subscription', {
              customer_email: email,
              subscription_id: subId,
              quantity: parseInt(quantity)
            });
            console.log('✅ Subscription updated');
            break;
          case 'c':
            const reason = await this.prompt('Cancellation reason: ');
            await this.callTool('cancel_subscription', {
              customer_email: email,
              subscription_id: subId,
              cancellation_reason: reason
            });
            console.log('✅ Subscription cancelled');
            break;
        }
      }
    } else {
      console.log('No active subscriptions found');
    }
  }

  async orderTests() {
    const email = await this.prompt('Enter customer email: ');
    
    console.log('\n📦 Getting order history...');
    const response = await this.callTool('get_orders', {
      customer_email: email,
      limit: 5
    });
    
    if (response?.orders?.length > 0) {
      console.log(`Found ${response.orders.length} orders:`);
      response.orders.forEach(order => {
        console.log(`  - Order #${order.order_number}: ${order.total_price} (${order.status})`);
      });
    } else {
      console.log('No orders found');
    }
  }

  async addressTests() {
    const email = await this.prompt('Enter customer email: ');
    
    console.log('\n🏠 Getting addresses...');
    const response = await this.callTool('get_addresses', {
      customer_email: email
    });
    
    if (response?.addresses?.length > 0) {
      console.log(`Found ${response.addresses.length} addresses:`);
      response.addresses.forEach(addr => {
        console.log(`  - ${addr.address1}, ${addr.city}, ${addr.province} ${addr.zip}`);
      });
    } else {
      console.log('No addresses found');
    }
  }

  async paymentTests() {
    const email = await this.prompt('Enter customer email: ');
    
    console.log('\n💳 Getting payment methods...');
    const response = await this.callTool('get_payment_methods', {
      customer_email: email
    });
    
    if (response?.payment_methods?.length > 0) {
      console.log(`Found ${response.payment_methods.length} payment methods:`);
      response.payment_methods.forEach(pm => {
        console.log(`  - ${pm.payment_type}: **** ${pm.last4 || 'N/A'}`);
      });
    } else {
      console.log('No payment methods found');
    }
  }

  async customCall() {
    const toolName = await this.prompt('Tool name: ');
    const argsStr = await this.prompt('Arguments (JSON): ');
    
    try {
      const args = JSON.parse(argsStr);
      const response = await this.callTool(toolName, args);
      console.log('\nResponse:', JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('Error:', error.message);
    }
  }

  async callTool(name, args) {
    const response = await this.sendRequest({
      method: 'tools/call',
      params: { name, arguments: args }
    });
    return response;
  }

  async sendRequest(request) {
    return new Promise((resolve, reject) => {
      const fullRequest = {
        jsonrpc: '2.0',
        id: this.requestId++,
        ...request
      };

      const serverPath = join(__dirname, 'src', 'server.js');
      const child = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', () => {
        try {
          const response = JSON.parse(output);
          if (response.error) {
            console.error('MCP Error:', response.error.message);
            resolve(null);
          } else {
            resolve(response.result);
          }
        } catch (error) {
          console.error('Parse error:', error.message);
          if (errorOutput) console.error('Server error:', errorOutput);
          resolve(null);
        }
      });

      child.stdin.write(JSON.stringify(fullRequest));
      child.stdin.end();
    });
  }

  prompt(question) {
    return new Promise(resolve => {
      rl.question(question, resolve);
    });
  }
}

// Start the tester
const tester = new MCPTester();
tester.start().catch(console.error);
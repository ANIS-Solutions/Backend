import fs from 'fs';

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1';
const OUTPUT_FILE = './seed/seed-output.json';

const parents = [
  {
    email: 'parent1@test.com',
    phone: '+201111111111',
    firstName: 'Ali',
    lastName: 'Hassan',
  },
  {
    email: 'parent2@test.com',
    phone: '+201222222222',
    firstName: 'Mona',
    lastName: 'Adel',
  },
  {
    email: 'parent3@test.com',
    phone: '+201333333333',
    firstName: 'Omar',
    lastName: 'Samy',
  },
];

const PASSWORD = 'Very-Hard-P@ssw0rd';

const childrenNames = [
  ['Youssef', 'Laila'],
  ['Adam', 'Sara', 'Nour'],
  ['Karim', 'Tarek'],
];

const locations = [
  {
    title: 'Home',
    address: 'Maadi, Cairo',
    coordinates: [31.2709, 29.9842],
  },
  {
    title: 'School',
    address: 'Nasr City, Cairo',
    coordinates: [31.3, 30.05],
  },
];

// 📦 in-memory store
const output = {
  parents: [],
};

async function registerParent(parent) {
  const res = await axios.post(`${BASE_URL}/auth/register`, {
    email: parent.email,
    password: PASSWORD,
    confirmPassword: PASSWORD,
    phone: parent.phone,
    firstName: parent.firstName,
    lastName: parent.lastName,
    birthDate: '11/05/1990',
  });

  return {
    token: res.data.accessToken,
    user: res.data.data.user,
  };
}

async function createChild(token, name) {
  const res = await axios.post(
    `${BASE_URL}/children`,
    {
      firstName: name,
      lastName: 'Child',
      gender: 'MALE',
      hobbies: ['swim', 'football'],
      dob: '11/05/2014',
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return {
    childId: res.data.data.id,
    pairToken: res.data.devInfo.pairToken,
    info: res.data.data,
  };
}

async function pairChild(child) {
  await axios.post(`${BASE_URL}/children/pair`, {
    childId: child.childId,
    token: child.pairToken,
    deviceId: `device-${child.childId}`,
    deviceName: 'iPhone Kid',
  });
}

async function addLocations(token, childId) {
  const createdLocations = [];

  for (const loc of locations) {
    const res = await axios.post(
      `${BASE_URL}/locations/${childId}`,
      {
        title: loc.title,
        address: loc.address,
        location: {
          type: 'Point',
          coordinates: loc.coordinates,
        },
        safeRadius: 500,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    createdLocations.push(res.data.data);
  }

  return createdLocations;
}

async function run() {
  for (let i = 0; i < parents.length; i++) {
    console.log(`👨‍👩‍👧 Creating parent ${i + 1}`);

    const { token, user } = await registerParent(parents[i]);

    const parentRecord = {
      ...user,
      accessToken: token,
      children: [],
    };

    const kids = childrenNames[i];

    for (const kidName of kids) {
      console.log(`  👶 Adding child: ${kidName}`);

      const child = await createChild(token, kidName);

      await pairChild(child);

      const childLocations = await addLocations(token, child.childId);

      parentRecord.children.push({
        ...child.info,
        pairToken: child.pairToken,
        locations: childLocations,
      });
    }

    output.parents.push(parentRecord);
  }

  // 💾 write file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log(`✅ Data saved to ${OUTPUT_FILE}`);
}

run().catch((err) => {
  console.error(err.response?.data || err.message);
});

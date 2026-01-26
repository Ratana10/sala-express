"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */

    await queryInterface.bulkInsert(
      "Customers",
      [
        {
          firstName: "Ratana",
          lastName: "San",
          phone: "012345678",
          password: "12345678",
          username: "ratana",
          email: "ratana@test.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          firstName: "Tola",
          lastName: "Milk",
          phone: "012345679",
          password: "12345679",
          username: "tola",
          email: "tola@test.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete("Customer", null, {});
  },
};

// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../DODOGaslessTrading.sol";

contract DODOGaslessTradingTest is Test {
    DODOGaslessTrading public gaslessTrading;
    address public owner;
    address public insurance;
    address public dodoApprove;
    address public dodoApproveProxy;
    address public dodoRouteProxy;

    function setUp() public {
        owner = address(1);
        insurance = address(2);
        dodoApprove = address(3);
        dodoApproveProxy = address(4);
        dodoRouteProxy = address(5);
        gaslessTrading = new DODOGaslessTrading(owner, insurance, dodoApprove, dodoApproveProxy, dodoRouteProxy);
    }

    function testConstructor() public {
        assertEq(gaslessTrading.owner(), owner);
        assertEq(gaslessTrading._INSURANCE_(), insurance);
        assertEq(gaslessTrading._DODO_APPROVE_(), dodoApprove);
        assertEq(gaslessTrading._DODO_APPROVE_PROXY_(), dodoApproveProxy);
        assertEq(gaslessTrading._DODO_ROUTE_PROXY_(), dodoRouteProxy);
    }

    //=============== Functions ===============

    

    //============ Ownable ============

    function testAddRemoveAdminByOwner() public {
        address user1 = address(6);
        assertEq(gaslessTrading._IS_ADMIN_(user1), false);

        vm.prank(owner);
        gaslessTrading.addAdmin(user1);
        assertEq(gaslessTrading._IS_ADMIN_(user1), true);

        vm.prank(owner);
        gaslessTrading.removeAdmin(user1);
        assertEq(gaslessTrading._IS_ADMIN_(user1), false);
    }

    function testAddRemoveAdminByNonOwner() public {
        address user1 = address(6);
        assertEq(gaslessTrading._IS_ADMIN_(user1), false);

        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        gaslessTrading.addAdmin(user1);
        assertEq(gaslessTrading._IS_ADMIN_(user1), false);

        vm.prank(owner);
        gaslessTrading.addAdmin(user1);
        assertEq(gaslessTrading._IS_ADMIN_(user1), true);

        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        gaslessTrading.removeAdmin(user1);
        assertEq(gaslessTrading._IS_ADMIN_(user1), true); 
    }

    function testChangeInsuranceByOwner() public {
        address user1 = address(6);
        assertEq(gaslessTrading._INSURANCE_(), insurance);

        vm.prank(owner);
        gaslessTrading.changeInsurance(user1);
        assertEq(gaslessTrading._INSURANCE_(), user1);
    }

    function testChangeInsuranceByNonOwner() public {
        address user1 = address(6);
        assertEq(gaslessTrading._INSURANCE_(), insurance);

        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        gaslessTrading.changeInsurance(user1);
        assertEq(gaslessTrading._INSURANCE_(), insurance);
    }
}
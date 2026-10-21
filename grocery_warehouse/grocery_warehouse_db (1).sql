-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 20, 2026 at 05:24 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `grocery_warehouse_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `aisle`
--

CREATE TABLE `aisle` (
  `AisleID` int(11) NOT NULL,
  `AisleCode` varchar(50) NOT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `aisle`
--

INSERT INTO `aisle` (`AisleID`, `AisleCode`, `IsArchived`) VALUES
(1, 'AISLE-A', 'No'),
(2, 'AISLE-B', 'No'),
(3, 'AISLE-C', 'No'),
(4, 'AISLE-D', 'No'),
(5, 'a-123', 'No'),
(6, 'AISLE-E', 'No'),
(7, 'AISLE-F', 'No');

-- --------------------------------------------------------

--
-- Table structure for table `auditlog`
--

CREATE TABLE `auditlog` (
  `AuditLogID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `ActionType` varchar(100) NOT NULL,
  `TableAffected` varchar(100) DEFAULT NULL,
  `ActionTimestamp` datetime NOT NULL DEFAULT current_timestamp(),
  `Details` text DEFAULT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `auditlog`
--

INSERT INTO `auditlog` (`AuditLogID`, `UserID`, `ActionType`, `TableAffected`, `ActionTimestamp`, `Details`, `IsArchived`) VALUES
(1, 1, 'CREATE', 'product', '2026-09-14 18:35:02', 'Nag-add ug bag-ong product: Coca-Cola 1.5L', 'No'),
(2, 2, 'UPDATE', 'purchase_order', '2026-09-14 18:35:02', 'Gi-approve ang PO-0001', 'No'),
(3, 5, 'CREATE', 'purchase_order', '2026-09-14 18:35:02', 'Nag-create ug bag-ong purchase order', 'No'),
(4, 3, 'CREATE', 'receiving', '2026-09-14 18:35:02', 'Nag-record ug received stock gikan sa supplier', 'No'),
(5, 4, 'CREATE', 'stock_release', '2026-09-14 18:35:02', 'Nag-release ug stock para sa store request', 'No'),
(6, 1, 'LOGIN', 'user', '2026-09-14 19:51:41', 'User logged in: admin01', 'No'),
(7, 1, 'LOGIN', 'user', '2026-09-14 19:51:44', 'User logged in: admin01', 'No'),
(8, 1, 'LOGIN', 'user', '2026-09-14 19:52:26', 'User logged in: Admin', 'No'),
(9, 1, 'LOGIN', 'user', '2026-09-14 19:53:23', 'User logged in: Admin', 'No'),
(10, 1, 'LOGIN', 'user', '2026-09-14 19:53:36', 'User logged in: Admin', 'No'),
(11, 1, 'LOGIN', 'user', '2026-09-14 19:53:42', 'User logged in: Admin', 'No'),
(12, 1, 'LOGOUT', 'user', '2026-09-15 13:00:26', 'User logged out.', 'No'),
(13, 1, 'LOGIN', 'user', '2026-09-15 13:01:27', 'User logged in.', 'No'),
(14, 1, 'LOGIN', 'user', '2026-09-15 13:20:23', 'User logged in.', 'No'),
(15, 1, 'LOGOUT', 'user', '2026-09-15 13:22:58', 'User logged out.', 'No'),
(16, 1, 'LOGIN', 'user', '2026-09-15 13:23:08', 'User logged in.', 'No'),
(17, 1, 'ARCHIVE', 'shelf', '2026-09-15 13:24:35', 'Archived ShelfID: 1', 'No'),
(18, 1, 'LOGIN', 'user', '2026-09-15 13:51:37', 'User logged in.', 'No'),
(19, 1, 'LOGOUT', 'user', '2026-09-15 14:11:51', 'User logged out.', 'No'),
(20, 1, 'LOGIN', 'user', '2026-09-15 14:12:17', 'User logged in.', 'No'),
(21, 1, 'LOGOUT', 'user', '2026-09-15 14:12:18', 'User logged out.', 'No'),
(22, 1, 'LOGIN', 'user', '2026-09-15 14:14:50', 'User logged in.', 'No'),
(23, 1, 'LOGOUT', 'user', '2026-09-15 14:17:40', 'User logged out.', 'No'),
(24, 1, 'LOGIN', 'user', '2026-09-15 14:35:46', 'User logged in.', 'No'),
(25, 1, 'LOGOUT', 'user', '2026-09-15 15:27:22', 'User logged out.', 'No'),
(26, 1, 'LOGIN', 'user', '2026-09-15 15:27:48', 'User logged in: Admin', 'No'),
(27, 1, 'UPDATE', 'product', '2026-09-15 15:48:55', 'Updated product: Del Monte Pineapple Juice 1L', 'No'),
(28, 1, 'DELETE', 'shelf', '2026-09-15 15:51:41', 'Archived shelf: D-SHELF-01', 'No'),
(29, 1, 'DELETE', 'shelf', '2026-09-15 15:52:05', 'Archived shelf: D-SHELF-01', 'No'),
(30, 1, 'CREATE', 'category', '2026-09-15 15:53:33', 'Created category: Condiments', 'No'),
(31, 1, 'CREATE', 'category', '2026-09-15 15:53:37', 'Created category: Condiments', 'No'),
(32, 1, 'DELETE', 'category', '2026-09-15 15:53:55', 'Archived category: Condiments', 'No'),
(33, 1, 'DELETE', 'shelf', '2026-09-15 15:58:25', 'Archived shelf: D-SHELF-01', 'No'),
(34, 1, 'RESTORE', 'shelf', '2026-09-15 16:30:05', 'Shelf ID 6 restored from archive.', 'No'),
(35, 1, 'RESTORE', 'shelf', '2026-09-15 16:30:09', 'Shelf ID 1 restored from archive.', 'No'),
(36, 1, 'DELETE', 'user', '2026-09-15 16:30:33', 'Archived user: purch01', 'No'),
(37, 1, 'RESTORE', 'user', '2026-09-15 16:30:37', 'User ID 5 restored from archive.', 'No'),
(38, 1, 'DELETE', 'aisle', '2026-09-15 16:38:24', 'Archived aisle: AISLE-D', 'No'),
(39, 1, 'RESTORE', 'aisle', '2026-09-15 16:38:30', 'Aisle ID 4 restored from archive.', 'No'),
(40, 1, 'DELETE', 'aisle', '2026-09-15 16:39:29', 'Archived aisle: AISLE-D', 'No'),
(41, 1, 'RESTORE', 'aisle', '2026-09-15 16:39:32', 'Aisle ID 4 restored from archive.', 'No'),
(42, 1, 'DELETE', 'product', '2026-09-15 16:41:08', 'Archived product: Del Monte Pineapple Juice 1L', 'No'),
(43, 1, 'RESTORE', 'product', '2026-09-15 16:41:27', 'Product ID 10 restored from archive.', 'No'),
(44, 1, 'DELETE', 'category', '2026-09-15 16:41:47', 'Archived category: Condiments', 'No'),
(45, 1, 'RESTORE', 'category', '2026-09-15 16:42:08', 'Category ID 8 restored from archive.', 'No'),
(46, 1, 'STATUS CHANGE', 'purchase_order', '2026-09-15 16:43:00', 'Purchase order (National Grains Supply) status changed from Pending to Pending', 'No'),
(47, 1, 'LOGIN', 'user', '2026-09-16 14:41:31', 'User logged in: Admin', 'No'),
(48, 1, 'LOGIN', 'user', '2026-09-16 21:36:59', 'User logged in.', 'No'),
(49, 1, 'LOGOUT', 'user', '2026-09-16 21:37:11', 'User logged out.', 'No'),
(50, 5, 'LOGIN', 'user', '2026-09-16 21:42:58', 'User logged in.', 'No'),
(51, 5, 'INSERT', 'purchase_return', '2026-09-16 21:45:01', 'Created purchase return #3 for PO #3.', 'No'),
(52, 5, 'UPDATE', 'purchase_return', '2026-09-16 21:45:09', 'Updated purchase return #3.', 'No'),
(53, 5, 'LOGOUT', 'user', '2026-09-16 21:58:31', 'User logged out.', 'No'),
(54, 1, 'LOGIN', 'user', '2026-09-16 21:58:44', 'User logged in.', 'No'),
(55, 1, 'LOGOUT', 'user', '2026-09-16 22:25:46', 'User logged out.', 'No'),
(56, 5, 'LOGIN', 'user', '2026-09-16 22:25:57', 'User logged in.', 'No'),
(57, 5, 'LOGOUT', 'user', '2026-09-16 23:19:42', 'User logged out.', 'No'),
(58, 4, 'LOGIN', 'user', '2026-09-16 23:19:54', 'User logged in.', 'No'),
(59, 4, 'LOGIN', 'user', '2026-09-16 23:27:26', 'User logged in.', 'No'),
(60, 4, 'LOGIN', 'user', '2026-09-16 23:28:14', 'User logged in.', 'No'),
(61, 4, 'LOGIN', 'user', '2026-09-16 23:28:26', 'User logged in.', 'No'),
(62, 4, 'LOGIN', 'user', '2026-09-16 23:28:29', 'User logged in.', 'No'),
(63, 4, 'LOGIN', 'user', '2026-09-16 23:30:10', 'User logged in.', 'No'),
(64, 4, 'LOGIN', 'user', '2026-09-16 23:34:06', 'User logged in.', 'No'),
(65, 4, 'LOGOUT', 'user', '2026-09-17 00:00:33', 'Inventory Staff logged out.', 'No'),
(66, 5, 'LOGIN', 'user', '2026-09-17 00:01:30', 'User logged in.', 'No'),
(67, 5, 'LOGOUT', 'user', '2026-09-17 00:04:41', 'User logged out.', 'No'),
(68, 4, 'LOGIN', 'user', '2026-09-17 00:05:08', 'User logged in.', 'No'),
(69, 4, 'LOGIN', 'user', '2026-09-17 00:27:55', 'User logged in.', 'No'),
(70, 1, 'LOGOUT', 'user', '2026-09-17 00:32:41', 'User logged out.', 'No'),
(71, 4, 'LOGIN', 'user', '2026-09-17 00:32:55', 'User logged in.', 'No'),
(72, 4, 'LOGOUT', 'user', '2026-09-17 00:49:52', 'Inventory Staff logged out.', 'No'),
(73, 1, 'LOGIN', 'user', '2026-09-17 09:23:08', 'User logged in.', 'No'),
(74, 1, 'LOGOUT', 'user', '2026-09-17 09:23:32', 'User logged out.', 'No'),
(75, 5, 'LOGIN', 'user', '2026-09-17 09:23:56', 'User logged in.', 'No'),
(76, 5, 'LOGOUT', 'user', '2026-09-17 09:24:16', 'User logged out.', 'No'),
(77, 4, 'LOGIN', 'user', '2026-09-17 09:24:27', 'User logged in.', 'No'),
(78, 4, 'LOGOUT', 'user', '2026-09-17 09:25:32', 'Inventory Staff logged out.', 'No'),
(79, 1, 'LOGIN', 'user', '2026-09-17 09:25:48', 'User logged in.', 'No'),
(80, 1, 'UPDATE', 'user', '2026-09-17 09:48:13', 'Changed UserID 1 status to Inactive', 'No'),
(81, 4, 'LOGOUT', 'user', '2026-09-17 10:10:17', 'User logged out.', 'No'),
(82, 1, 'LOGIN', 'user', '2026-09-17 10:10:32', 'User logged in.', 'No'),
(83, 1, 'ARCHIVE', 'category', '2026-09-17 10:10:52', 'Archived CategoryID: 1', 'No'),
(84, 1, 'ARCHIVE', 'user', '2026-09-17 10:15:00', 'Archived UserID: 2', 'No'),
(85, 1, 'UNARCHIVE', 'category', '2026-09-17 10:18:02', 'Restored CategoryID: 1', 'No'),
(86, 1, 'UNARCHIVE', 'category', '2026-09-17 10:18:03', 'Restored CategoryID: 9', 'No'),
(87, 1, 'UPDATE', 'category', '2026-09-17 10:18:19', 'Updated CategoryID: 8', 'No'),
(88, 1, 'LOGOUT', 'user', '2026-09-17 10:18:21', 'User logged out.', 'No'),
(89, 1, 'LOGIN', 'user', '2026-09-17 10:18:31', 'User logged in.', 'No'),
(90, 1, 'ARCHIVE', 'category', '2026-09-17 10:18:40', 'Archived CategoryID: 8', 'No'),
(91, 1, 'ARCHIVE', 'bin', '2026-09-17 10:19:15', 'Archived BinID: 1', 'No'),
(92, 1, 'UNARCHIVE', 'bin', '2026-09-17 10:19:18', 'Restored BinID: 1', 'No'),
(93, 4, 'LOGOUT', 'user', '2026-09-17 10:28:02', 'Inventory Staff logged out.', 'No'),
(94, 1, 'LOGIN', 'user', '2026-09-17 10:28:11', 'User logged in.', 'No'),
(95, 1, 'ARCHIVE', 'category', '2026-09-17 10:28:37', 'Archived Category: Beverages', 'No'),
(96, 1, 'ARCHIVE', 'user', '2026-09-17 10:28:49', 'Archived User: staff01', 'No'),
(97, 1, 'ARCHIVE', 'supplier', '2026-09-17 10:28:57', 'Archived Supplier: National Grains Supply', 'No'),
(98, 1, 'ARCHIVE', 'category', '2026-09-17 10:29:04', 'Archived Category: Snacks', 'No'),
(99, 1, 'ARCHIVE', 'product', '2026-09-17 11:24:42', 'Archived Product: Alaska Fresh Milk 1L', 'No'),
(100, 1, 'LOGOUT', 'user', '2026-09-17 11:40:20', 'User logged out.', 'No'),
(101, 2, 'LOGIN', 'user', '2026-09-17 11:41:13', 'User logged in.', 'No'),
(102, 2, 'LOGOUT', 'user', '2026-09-17 12:23:18', 'Receiving staff logged out.', 'No'),
(103, 1, 'LOGIN', 'user', '2026-09-17 12:23:38', 'User logged in.', 'No'),
(104, 1, 'UNARCHIVE', 'supplier', '2026-09-17 12:23:48', 'Restored Supplier: National Grains Supply', 'No'),
(105, 1, 'LOGOUT', 'user', '2026-09-17 12:23:58', 'User logged out.', 'No'),
(106, 2, 'LOGIN', 'user', '2026-09-17 12:24:13', 'User logged in.', 'No'),
(107, 2, 'INSERT', 'receiving', '2026-09-17 12:52:41', 'Created Receiving #7', 'No'),
(108, 2, 'LOGOUT', 'user', '2026-09-17 13:01:07', 'Receiving staff logged out.', 'No'),
(109, 1, 'LOGIN', 'user', '2026-09-17 13:01:29', 'User logged in.', 'No'),
(110, 1, 'LOGOUT', 'user', '2026-09-17 13:02:19', 'User logged out.', 'No'),
(111, 1, 'LOGIN', 'user', '2026-09-17 13:02:37', 'User logged in.', 'No'),
(112, 1, 'LOGOUT', 'user', '2026-09-17 13:03:25', 'User logged out.', 'No'),
(113, 4, 'LOGIN', 'user', '2026-09-17 13:05:34', 'User logged in.', 'No'),
(114, 1, 'LOGOUT', 'user', '2026-09-17 13:12:00', 'User logged out.', 'No'),
(115, 4, 'LOGIN', 'user', '2026-09-17 13:12:11', 'User logged in.', 'No'),
(116, 4, 'LOGOUT', 'user', '2026-09-17 13:15:21', 'Inventory Staff logged out.', 'No'),
(117, 1, 'LOGIN', 'user', '2026-09-17 13:15:37', 'User logged in.', 'No'),
(118, 1, 'LOGOUT', 'user', '2026-09-17 13:16:02', 'User logged out.', 'No'),
(119, 4, 'LOGIN', 'user', '2026-09-17 13:16:23', 'User logged in.', 'No'),
(120, 4, 'LOGOUT', 'user', '2026-09-17 13:18:06', 'Inventory Staff logged out.', 'No'),
(121, 1, 'LOGIN', 'user', '2026-09-17 13:18:18', 'User logged in.', 'No'),
(122, 1, 'UNARCHIVE', 'product', '2026-09-17 13:18:35', 'Restored Product: Alaska Fresh Milk 1L', 'No'),
(123, 1, 'LOGOUT', 'user', '2026-09-17 13:18:37', 'User logged out.', 'No'),
(124, 4, 'LOGIN', 'user', '2026-09-17 13:19:57', 'User logged in.', 'No'),
(125, 4, 'LOGOUT', 'user', '2026-09-17 13:27:35', 'Inventory Staff logged out.', 'No'),
(126, 4, 'LOGOUT', 'user', '2026-09-17 13:40:17', 'Inventory Staff logged out.', 'No'),
(127, 3, 'LOGIN', 'user', '2026-09-17 13:40:41', 'User logged in.', 'No'),
(128, 3, 'LOGOUT', 'user', '2026-09-17 14:17:01', 'Manager logged out.', 'No'),
(129, 1, 'LOGIN', 'user', '2026-09-17 14:17:18', 'User logged in.', 'No'),
(130, 1, 'UPDATE', 'role', '2026-09-17 14:17:54', 'Updated Role: Administrator', 'No'),
(131, 1, 'ARCHIVE', 'role', '2026-09-17 14:19:17', 'Archived Role: Administrator', 'No'),
(132, 1, 'ARCHIVE', 'role', '2026-09-17 14:19:40', 'Archived Role: Warehouse Manager', 'No'),
(133, 1, 'UNARCHIVE', 'role', '2026-09-17 14:19:45', 'Restored Role: Warehouse Manager', 'No'),
(134, 1, 'ARCHIVE', 'category', '2026-09-17 14:19:50', 'Archived Category: Personal Care', 'No'),
(135, 1, 'UNARCHIVE', 'category', '2026-09-17 14:19:58', 'Restored Category: Beverages', 'No'),
(136, 1, 'UNARCHIVE', 'category', '2026-09-17 14:20:00', 'Restored Category: Personal Care', 'No'),
(137, 1, 'UNARCHIVE', 'category', '2026-09-17 14:20:02', 'Restored Category: Snacks', 'No'),
(138, 1, 'UPDATE', 'category', '2026-09-17 14:20:12', 'Updated Category: Beverages', 'No'),
(139, 1, 'ARCHIVE', 'category', '2026-09-17 14:20:54', 'Archived Category: Snacks', 'No'),
(140, 1, 'UNARCHIVE', 'category', '2026-09-17 14:20:57', 'Restored Category: Snacks', 'No'),
(141, 1, 'UPDATE', 'supplier', '2026-09-17 14:21:22', 'Updated Supplier: CleanHome Supplies Corp.', 'No'),
(142, 1, 'UPDATE', 'supplier', '2026-09-17 14:21:27', 'Updated Supplier: CleanHome Supplies Corp', 'No'),
(143, 1, 'UPDATE', 'supplier', '2026-09-17 14:21:34', 'Updated Supplier: CleanHome Supplies Corp', 'No'),
(144, 1, 'ARCHIVE', 'supplier', '2026-09-17 14:21:42', 'Archived Supplier: CleanHome Supplies Corp.', 'No'),
(145, 1, 'UNARCHIVE', 'supplier', '2026-09-17 14:21:45', 'Restored Supplier: CleanHome Supplies Corp.', 'No'),
(146, 1, 'UPDATE', 'product', '2026-09-17 14:22:01', 'Updated Product: Alaska Fresh Milk 1L', 'No'),
(147, 1, 'ARCHIVE', 'product', '2026-09-17 14:22:03', 'Archived Product: Alaska Fresh Milk 1L', 'No'),
(148, 1, 'UNARCHIVE', 'product', '2026-09-17 14:22:06', 'Restored Product: Alaska Fresh Milk 1L', 'No'),
(149, 1, 'UPDATE', 'user', '2026-09-17 14:22:13', 'Changed User: Owen status to Inactive', 'No'),
(150, 1, 'UPDATE', 'user', '2026-09-17 14:22:15', 'Changed User: Owen status to Active', 'No'),
(151, 1, 'LOGOUT', 'user', '2026-09-17 14:22:44', 'User logged out.', 'No'),
(152, 4, 'LOGIN', 'user', '2026-09-17 14:22:54', 'User logged in.', 'No'),
(153, 4, 'LOGOUT', 'user', '2026-09-17 14:23:08', 'User logged out.', 'No'),
(154, 4, 'LOGIN', 'user', '2026-09-17 14:23:36', 'User logged in.', 'No'),
(155, 4, 'LOGOUT', 'user', '2026-09-17 14:25:44', 'User logged out.', 'No'),
(156, 4, 'LOGIN', 'user', '2026-09-17 14:26:37', 'User logged in.', 'No'),
(157, 4, 'LOGIN', 'user', '2026-09-17 14:30:33', 'User logged in.', 'No'),
(158, 4, 'LOGOUT', 'user', '2026-09-17 14:32:44', 'User logged out.', 'No'),
(159, 3, 'LOGIN', 'user', '2026-09-17 14:33:00', 'User logged in.', 'No'),
(160, 3, 'LOGOUT', 'user', '2026-09-17 14:33:08', 'Manager logged out.', 'No'),
(161, 3, 'LOGIN', 'user', '2026-09-17 14:33:15', 'User logged in.', 'No'),
(162, 3, 'LOGOUT', 'user', '2026-09-17 14:33:50', 'Manager logged out.', 'No'),
(163, 2, 'LOGIN', 'user', '2026-09-17 14:34:59', 'User logged in.', 'No'),
(164, 2, 'LOGOUT', 'user', '2026-09-17 14:35:27', 'Receiving staff logged out.', 'No'),
(165, 4, 'LOGIN', 'user', '2026-09-17 14:36:02', 'User logged in.', 'No'),
(166, 4, 'LOGOUT', 'user', '2026-09-17 14:37:58', 'Inventory Staff logged out.', 'No'),
(167, 1, 'LOGIN', 'user', '2026-09-17 15:11:39', 'User logged in.', 'No'),
(168, 1, 'LOGIN', 'user', '2026-09-17 18:13:40', 'User logged in.', 'No'),
(169, 1, 'UPDATE', 'user', '2026-09-17 18:13:57', 'Changed User: Admin status to Inactive', 'No'),
(170, 1, 'LOGIN', 'user', '2026-09-17 18:23:33', 'User logged in.', 'No'),
(171, 1, 'UPDATE', 'purchase_order', '2026-09-17 18:30:33', 'Changed status of purchase_order #4 to StatusID: 3', 'No'),
(172, 1, 'UPDATE', 'inventory_adjustment', '2026-09-17 18:30:38', 'Changed status of inventory_adjustment #2 to StatusID: 4', 'No'),
(173, 1, 'UPDATE', 'stock_return', '2026-09-17 18:30:43', 'Changed status of stock_return #2 to StatusID: 4', 'No'),
(174, 1, 'UPDATE', 'purchase_order', '2026-09-17 18:30:58', 'Changed status of purchase_order #4 to StatusID: 1', 'No'),
(175, 1, 'UPDATE', 'purchase_order', '2026-09-17 18:31:01', 'Changed status of purchase_order #3 to StatusID: 1', 'No'),
(176, 1, 'UPDATE', 'purchase_order', '2026-09-17 18:31:08', 'Changed status of purchase_order #3 to StatusID: 3', 'No'),
(177, 1, 'UPDATE', 'purchase_order', '2026-09-17 18:38:28', 'Changed Purchase Order #4 (National Grains Supply) status to Completed', 'No'),
(178, 1, 'UPDATE', 'purchase_order', '2026-09-17 18:38:38', 'Changed Purchase Order #4 (National Grains Supply) status to Pending', 'No'),
(179, 1, 'INSERT', 'category', '2026-09-17 18:53:54', 'Added Category: dry goods', 'No'),
(180, 1, 'INSERT', 'aisle', '2026-09-17 18:54:26', 'Added Aisle: a-123', 'No'),
(181, 1, 'INSERT', 'shelf', '2026-09-17 18:54:38', 'Added Shelf: a-123 / shelf-90', 'No'),
(182, 1, 'INSERT', 'bin', '2026-09-17 18:54:51', 'Added Bin: a-123 / shelf-90 / bin90', 'No'),
(183, 1, 'INSERT', 'supplier', '2026-09-17 18:56:11', 'Added Supplier: owen inc.', 'No'),
(184, 1, 'INSERT', 'role', '2026-09-17 18:57:19', 'Added Role: inventory clerk', 'No'),
(185, 1, 'INSERT', 'user', '2026-09-17 18:58:01', 'Added User: jenn', 'No'),
(186, 1, 'INSERT', 'product', '2026-09-17 18:58:46', 'Added Product: bombay', 'No'),
(187, 1, 'LOGIN', 'user', '2026-09-21 18:08:34', 'User logged in.', 'No'),
(188, 1, 'ARCHIVE', 'role', '2026-09-21 18:08:47', 'Archived Role: Warehouse Manager', 'No'),
(189, 1, 'LOGIN', 'user', '2026-09-21 19:23:06', 'User logged in.', 'No'),
(190, 1, 'ARCHIVE', 'unit_of_measure', '2026-09-21 19:55:28', 'Archived Unit: Box', 'No'),
(191, 1, 'UPDATE', 'unit_of_measure', '2026-09-21 19:56:44', 'Updated Unit: Kilogram', 'No'),
(192, 1, 'UPDATE', 'unit_of_measure', '2026-09-21 19:56:54', 'Updated Unit: Kilogramm', 'No'),
(193, 1, 'LOGOUT', 'user', '2026-09-22 13:38:29', 'User logged out.', 'No'),
(194, 1, 'LOGIN', 'user', '2026-09-22 13:39:35', 'User logged in.', 'No'),
(195, 1, 'LOGOUT', 'user', '2026-09-22 13:39:36', 'User logged out.', 'No'),
(196, 4, 'LOGIN', 'user', '2026-09-22 13:40:18', 'User logged in.', 'No'),
(197, 4, 'INSERT', 'stock_return', '2026-09-22 13:56:41', 'Created stock return #3 for ProductID: 4', 'No'),
(198, 4, 'UPDATE', 'stock_return', '2026-09-22 13:57:18', 'Updated stock return #3', 'No'),
(199, 4, 'UPDATE', 'stock_return', '2026-09-22 13:57:42', 'Updated stock return #3', 'No'),
(200, 4, 'UPDATE', 'stock_return', '2026-09-22 13:58:04', 'Updated stock return #3', 'No'),
(201, 4, 'LOGOUT', 'user', '2026-09-22 14:20:58', 'Inventory Staff logged out.', 'No'),
(202, 1, 'LOGIN', 'user', '2026-09-22 14:21:04', 'User logged in.', 'No'),
(203, 1, 'UPDATE', 'user', '2026-09-22 14:22:03', 'Changed User: Owen status to Inactive', 'No'),
(204, 1, 'UPDATE', 'user', '2026-09-22 14:22:09', 'Changed User: Owen status to Active', 'No'),
(205, 1, 'UPDATE', 'user', '2026-09-22 14:22:12', 'Changed User: Owen status to Inactive', 'No'),
(206, 1, 'UPDATE', 'user', '2026-09-22 14:22:19', 'Changed User: Owen status to Active', 'No'),
(207, 1, 'LOGOUT', 'user', '2026-09-22 14:23:05', 'User logged out.', 'No'),
(208, 4, 'LOGIN', 'user', '2026-09-22 14:23:13', 'User logged in.', 'No'),
(209, 4, 'INSERT', 'inventory_adjustment', '2026-09-22 14:44:15', 'Created adjustment #3 for ProductID: 4', 'No'),
(210, 4, 'UPDATE', 'inventory_adjustment', '2026-09-22 14:44:41', 'Updated adjustment #3', 'No'),
(211, 4, 'LOGOUT', 'user', '2026-09-22 14:48:52', 'Inventory Staff logged out.', 'No'),
(212, 1, 'LOGIN', 'user', '2026-09-22 14:48:59', 'User logged in.', 'No'),
(213, 1, 'LOGOUT', 'user', '2026-09-22 14:49:03', 'User logged out.', 'No'),
(214, 4, 'LOGIN', 'user', '2026-09-22 14:49:18', 'User logged in.', 'No'),
(215, 4, 'LOGOUT', 'user', '2026-09-22 15:07:26', 'Inventory Staff logged out.', 'No'),
(216, 1, 'LOGIN', 'user', '2026-09-22 15:07:31', 'User logged in.', 'No'),
(217, 1, 'LOGOUT', 'user', '2026-09-22 15:08:38', 'User logged out.', 'No'),
(218, 4, 'LOGIN', 'user', '2026-09-22 15:08:44', 'User logged in.', 'No'),
(219, 1, 'LOGOUT', 'user', '2026-09-22 15:27:10', 'User logged out.', 'No'),
(220, 4, 'LOGIN', 'user', '2026-09-22 15:27:22', 'User logged in.', 'No'),
(221, 4, 'LOGOUT', 'user', '2026-09-22 15:32:30', 'Inventory Staff logged out.', 'No'),
(222, 1, 'LOGIN', 'user', '2026-09-22 15:32:39', 'User logged in.', 'No'),
(223, 1, 'UNARCHIVE', 'unit_of_measure', '2026-09-22 15:40:31', 'Restored Unit: Box', 'No'),
(224, 1, 'ARCHIVE', 'unit_of_measure', '2026-09-22 15:40:37', 'Archived Unit: Box', 'No'),
(225, 1, 'ARCHIVE', 'product', '2026-09-22 15:47:03', 'Archived Product: Piattos Cheese 85g', 'No'),
(226, 1, 'UNARCHIVE', 'product', '2026-09-22 15:47:09', 'Restored Product: Piattos Cheese 85g', 'No'),
(227, 1, 'ARCHIVE', 'product', '2026-09-22 15:47:15', 'Archived Product: Piattos Cheese 85g', 'No'),
(228, 1, 'UNARCHIVE', 'product', '2026-09-22 15:47:19', 'Restored Product: Piattos Cheese 85g', 'No'),
(229, 1, 'UNARCHIVE', 'unit_of_measure', '2026-09-22 15:52:45', 'Restored Unit: Box', 'No'),
(230, 1, 'ARCHIVE', 'unit_of_measure', '2026-09-22 17:10:58', 'Archived Unit: Sack', 'No'),
(231, 1, 'UNARCHIVE', 'unit_of_measure', '2026-09-22 17:11:01', 'Restored Unit: Sack', 'No'),
(232, 1, 'ARCHIVE', 'unit_of_measure', '2026-09-22 17:11:06', 'Archived Unit: Sack', 'No'),
(233, 1, 'UNARCHIVE', 'unit_of_measure', '2026-09-22 17:11:12', 'Restored Unit: Sack', 'No'),
(234, 1, 'ARCHIVE', 'category', '2026-09-22 17:11:19', 'Archived Category: Beverage', 'No'),
(235, 1, 'UNARCHIVE', 'category', '2026-09-22 17:11:32', 'Restored Category: Beverage', 'No'),
(236, 1, 'INSERT', 'unit_of_measure', '2026-09-22 17:12:49', 'Added Unit of Measure: Cans', 'No'),
(237, 1, 'ARCHIVE', 'unit_of_measure', '2026-09-22 17:12:53', 'Archived Unit: Cans', 'No'),
(238, 1, 'UNARCHIVE', 'unit_of_measure', '2026-09-22 17:12:56', 'Restored Unit: Cans', 'No'),
(239, 1, 'UPDATE', 'user', '2026-09-22 17:13:12', 'Changed User: Owen status to Inactive', 'No'),
(240, 1, 'ARCHIVE', 'user', '2026-09-22 17:13:15', 'Archived User: Owen', 'No'),
(241, 1, 'UNARCHIVE', 'user', '2026-09-22 17:13:18', 'Restored User: Owen', 'No'),
(242, 1, 'ARCHIVE', 'supplier', '2026-09-22 17:13:24', 'Archived Supplier: owen inc.', 'No'),
(243, 1, 'UNARCHIVE', 'supplier', '2026-09-22 17:13:27', 'Restored Supplier: owen inc.', 'No'),
(244, 1, 'ARCHIVE', 'category', '2026-09-22 17:13:32', 'Archived Category: Snacks', 'No'),
(245, 1, 'UNARCHIVE', 'category', '2026-09-22 17:13:36', 'Restored Category: Snacks', 'No'),
(246, 1, 'UNARCHIVE', 'category', '2026-09-22 17:13:39', 'Restored Category: Condimen', 'No'),
(247, 1, 'LOGOUT', 'user', '2026-09-22 17:46:52', 'Admin logged out.', 'No'),
(248, 1, 'LOGIN', 'user', '2026-09-22 17:47:01', 'Admin logged in.', 'No'),
(249, 1, 'UPDATE', 'user', '2026-09-22 18:59:07', 'Changed User: Owen status to Active', 'No'),
(250, 1, 'LOGIN', 'user', '2026-09-22 19:19:07', 'Admin logged in.', 'No'),
(251, 1, 'UPDATE', 'purchase_order', '2026-09-22 19:41:31', 'Changed purchase_order #4 status to StatusID 2', 'No'),
(252, 1, 'UPDATE', 'receiving', '2026-09-22 19:41:36', 'Changed receiving #7 status to StatusID 2', 'No'),
(253, 1, 'UPDATE', 'stock_release', '2026-09-22 19:41:42', 'Changed stock_release #3 status to StatusID 2', 'No'),
(254, 1, 'UPDATE', 'stock_return', '2026-09-22 19:41:55', 'Changed stock_return #3 status to StatusID 2', 'No'),
(255, 1, 'UPDATE', 'inventory_adjustment', '2026-09-22 19:42:01', 'Changed inventory_adjustment #3 status to StatusID 2', 'No'),
(256, 1, 'UPDATE', 'purchase_order', '2026-09-22 19:56:07', 'Changed Purchase Order to National Grains Supply (2026-09-01) status to Cancelled', 'No'),
(257, 1, 'UPDATE', 'purchase_order', '2026-09-22 19:57:02', 'Changed Purchase Order to National Grains Supply (2026-09-01) status to Approved', 'No'),
(258, 1, 'ARCHIVE', 'role', '2026-09-22 19:57:41', 'Archived Role: inventory clerk', 'No'),
(259, 1, 'UNARCHIVE', 'role', '2026-09-22 19:57:48', 'Restored Role: inventory clerk', 'No'),
(260, 1, 'ARCHIVE', 'category', '2026-09-22 19:58:19', 'Archived Category: Condimen', 'No'),
(261, 1, 'UNARCHIVE', 'category', '2026-09-22 19:58:26', 'Restored Category: Condimen', 'No'),
(262, 1, 'UPDATE', 'supplier', '2026-09-22 19:58:37', 'Updated Supplier: CleanHome Supplies Corp.', 'No'),
(263, 1, 'ARCHIVE', 'supplier', '2026-09-22 19:59:09', 'Archived Supplier: owen inc.', 'No'),
(264, 1, 'UNARCHIVE', 'supplier', '2026-09-22 19:59:14', 'Restored Supplier: owen inc.', 'No'),
(265, 1, 'ARCHIVE', 'supplier', '2026-09-22 19:59:17', 'Archived Supplier: owen inc.', 'No'),
(266, 1, 'UPDATE', 'purchase_order', '2026-09-22 20:54:31', 'Changed Purchase Order to National Grains Supply (2026-09-01) status to Rejected', 'No'),
(267, 1, 'LOGIN', 'user', '2026-09-23 14:58:18', 'Admin logged in.', 'No'),
(268, 1, 'INSERT', 'supplier_product', '2026-09-23 14:58:51', 'Linked Product: Century Tuna Flakes in Oil 180g to Supplier: CleanHome Supplies Corp', 'No'),
(269, 1, 'UPDATE', 'inventory_adjustment', '2026-09-23 14:59:29', 'Changed Inventory Adjustment by jennie redondo (Reason: expired) status to Cancelled', 'No'),
(270, 1, 'INSERT', 'supplier_product', '2026-09-23 15:07:23', 'Linked Product: Alaska Fresh Milk 1L to Supplier: CleanHome Supplies Corp', 'No'),
(271, 1, 'LOGOUT', 'user', '2026-09-23 15:09:03', 'Admin logged out.', 'No'),
(272, 1, 'LOGIN', 'user', '2026-09-23 15:09:13', 'Admin logged in.', 'No'),
(273, 1, 'LOGIN', 'user', '2026-09-23 17:42:25', 'Admin logged in.', 'No'),
(274, 1, 'LOGOUT', 'user', '2026-09-23 17:43:34', 'Admin logged out.', 'No'),
(275, 1, 'LOGIN', 'user', '2026-09-23 17:43:42', 'Admin logged in.', 'No'),
(276, 1, 'UNARCHIVE', 'supplier', '2026-09-23 18:08:05', 'Restored Supplier: owen inc.', 'No'),
(277, 1, 'LOGOUT', 'user', '2026-09-23 18:08:58', 'Admin logged out.', 'No'),
(278, 4, 'LOGIN', 'user', '2026-09-23 18:09:37', 'Admin logged in.', 'No'),
(279, 1, 'LOGOUT', 'user', '2026-09-23 18:44:54', 'Admin logged out.', 'No'),
(280, 4, 'LOGIN', 'user', '2026-09-23 18:45:02', 'Admin logged in.', 'No'),
(281, 4, 'LOGOUT', 'user', '2026-09-23 19:01:24', 'Inventory Staff logged out.', 'No'),
(282, 1, 'LOGIN', 'user', '2026-09-23 19:01:33', 'Admin logged in.', 'No'),
(283, 1, 'LOGOUT', 'user', '2026-09-23 19:02:06', 'Admin logged out.', 'No'),
(284, 4, 'LOGIN', 'user', '2026-09-23 19:02:24', 'Admin logged in.', 'No'),
(285, 4, 'LOGIN', 'user', '2026-09-23 19:10:06', 'Admin logged in.', 'No'),
(286, 4, 'INSERT', 'inventory_adjustment', '2026-09-23 19:17:02', 'Created adjustment #4 for ProductID: 4', 'No'),
(287, 4, 'LOGOUT', 'user', '2026-09-23 19:38:11', 'Inventory Staff logged out.', 'No'),
(288, 1, 'LOGIN', 'user', '2026-09-23 19:38:20', 'Admin logged in.', 'No'),
(289, 1, 'LOGOUT', 'user', '2026-09-23 19:53:31', 'Admin logged out.', 'No'),
(290, 4, 'LOGIN', 'user', '2026-09-23 19:53:47', 'Admin logged in.', 'No'),
(291, 4, 'LOGOUT', 'user', '2026-09-27 18:08:46', 'Inventory Staff logged out.', 'No'),
(292, 1, 'LOGIN', 'user', '2026-09-27 18:09:06', 'Admin logged in.', 'No'),
(293, 1, 'UNARCHIVE', 'role', '2026-09-27 18:09:24', 'Restored Role: Warehouse Manager', 'No'),
(294, 1, 'LOGOUT', 'user', '2026-09-27 18:09:52', 'Admin logged out.', 'No'),
(295, 3, 'LOGIN', 'user', '2026-09-27 18:10:07', 'Admin logged in.', 'No'),
(296, 4, 'LOGOUT', 'user', '2026-09-27 18:16:36', 'Admin logged out.', 'No'),
(297, 1, 'LOGIN', 'user', '2026-09-27 18:16:46', 'Admin logged in.', 'No'),
(298, 1, 'UPDATE', 'user', '2026-09-27 18:22:30', 'Updated User: Admin', 'No'),
(299, 1, 'UPDATE', 'user', '2026-09-27 18:24:15', 'Updated User: Admin', 'No'),
(300, 1, 'UPDATE', 'user', '2026-09-27 18:24:19', 'Updated User: lian', 'No'),
(301, 1, 'LOGOUT', 'user', '2026-09-27 18:27:30', 'Admin logged out.', 'No'),
(302, 3, 'LOGIN', 'user', '2026-09-27 18:27:41', 'Admin logged in.', 'No'),
(303, 3, 'LOGIN', 'user', '2026-09-27 18:29:25', 'Admin logged in.', 'No'),
(304, 3, 'LOGIN', 'user', '2026-09-27 18:30:11', 'Admin logged in.', 'No'),
(305, 3, 'LOGIN', 'user', '2026-09-27 18:32:40', 'Admin logged in.', 'No'),
(306, 3, 'LOGOUT', 'user', '2026-09-27 18:35:32', 'Manager logged out.', 'No'),
(307, 1, 'LOGIN', 'user', '2026-09-27 18:38:34', 'Admin logged in.', 'No'),
(308, 1, 'UPDATE', 'user', '2026-09-27 18:39:00', 'Updated User: Admin', 'No'),
(309, 1, 'UPDATE', 'user', '2026-09-27 18:39:12', 'Updated User: Admin', 'No'),
(310, 1, 'LOGOUT', 'user', '2026-09-27 18:39:22', 'Admin logged out.', 'No'),
(311, 1, 'LOGIN', 'user', '2026-09-27 18:41:03', 'Admin logged in.', 'No'),
(312, 1, 'LOGOUT', 'user', '2026-09-27 18:42:19', 'Admin logged out.', 'No'),
(313, 3, 'LOGIN', 'user', '2026-09-27 18:42:39', 'Admin logged in.', 'No'),
(314, 1, 'LOGIN', 'user', '2026-09-27 18:52:41', 'Admin logged in.', 'No'),
(315, 1, 'ARCHIVE', 'user', '2026-09-27 19:25:21', 'Archived User: jenn', 'No'),
(316, 1, 'LOGOUT', 'user', '2026-09-27 19:25:27', 'Admin logged out.', 'No'),
(317, 3, 'LOGIN', 'user', '2026-09-27 19:25:36', 'Admin logged in.', 'No'),
(318, 3, 'LOGOUT', 'user', '2026-09-27 21:09:26', 'Manager logged out.', 'No'),
(319, 1, 'LOGIN', 'user', '2026-09-27 21:09:37', 'Admin logged in.', 'No'),
(320, 1, 'LOGOUT', 'user', '2026-09-27 21:10:26', 'Admin logged out.', 'No'),
(321, 1, 'LOGIN', 'user', '2026-09-27 21:10:34', 'Admin logged in.', 'No'),
(322, 1, 'LOGOUT', 'user', '2026-09-27 21:17:26', 'Admin logged out.', 'No'),
(323, 1, 'LOGIN', 'user', '2026-09-27 21:17:48', 'Admin logged in.', 'No'),
(324, 1, 'LOGOUT', 'user', '2026-09-27 21:18:35', 'Admin logged out.', 'No'),
(325, 3, 'LOGIN', 'user', '2026-09-27 21:18:41', 'Admin logged in.', 'No'),
(326, 1, 'LOGIN', 'user', '2026-09-27 21:51:49', 'Admin logged in.', 'No'),
(327, 1, 'LOGIN', 'user', '2026-09-29 11:26:14', 'Admin logged in.', 'No'),
(328, 1, 'ARCHIVE', 'product', '2026-09-29 11:26:31', 'Archived Product: Alaska Fresh Milk 1L', 'No'),
(329, 1, 'UNARCHIVE', 'product', '2026-09-29 11:26:34', 'Restored Product: Alaska Fresh Milk 1L', 'No'),
(330, 1, 'UPDATE', 'purchase_order', '2026-09-29 11:27:11', 'Changed Purchase Order to National Grains Supply (2026-09-01) status to Completed', 'No'),
(331, 1, 'LOGOUT', 'user', '2026-09-29 11:27:43', 'Admin logged out.', 'No'),
(332, 4, 'LOGIN', 'user', '2026-09-29 11:28:00', 'Admin logged in.', 'No'),
(333, 4, 'UPDATE', 'inventory_adjustment', '2026-09-29 11:28:23', 'Updated adjustment #4', 'No'),
(334, 4, 'UPDATE', 'inventory_adjustment', '2026-09-29 11:29:05', 'Updated adjustment #4', 'No'),
(335, 4, 'LOGOUT', 'user', '2026-09-29 11:30:34', 'Inventory Staff logged out.', 'No'),
(336, 3, 'LOGIN', 'user', '2026-09-29 11:30:51', 'Admin logged in.', 'No'),
(337, 3, 'LOGOUT', 'user', '2026-09-29 11:33:42', 'Manager logged out.', 'No'),
(338, 4, 'LOGIN', 'user', '2026-09-29 11:33:50', 'Admin logged in.', 'No'),
(339, 4, 'LOGOUT', 'user', '2026-09-29 11:40:45', 'Inventory Staff logged out.', 'No'),
(340, 1, 'LOGIN', 'user', '2026-09-29 11:40:52', 'Admin logged in.', 'No'),
(341, 1, 'INSERT', 'product', '2026-09-29 11:41:50', 'Added Product: Sprite', 'No'),
(342, 1, 'LOGOUT', 'user', '2026-09-29 11:42:04', 'Admin logged out.', 'No'),
(343, 4, 'LOGIN', 'user', '2026-09-29 11:42:22', 'Admin logged in.', 'No'),
(344, 4, 'LOGOUT', 'user', '2026-09-29 11:43:13', 'Inventory Staff logged out.', 'No'),
(345, 1, 'LOGIN', 'user', '2026-09-29 11:46:04', 'Admin logged in.', 'No'),
(346, 1, 'LOGIN', 'user', '2026-09-29 11:47:00', 'Admin logged in.', 'No'),
(347, 1, 'UPDATE', 'user', '2026-09-29 11:47:35', 'Updated User: lian', 'No'),
(348, 1, 'LOGOUT', 'user', '2026-09-29 11:47:40', 'Admin logged out.', 'No'),
(349, 5, 'LOGIN', 'user', '2026-09-29 11:47:54', 'Admin logged in.', 'No'),
(350, 1, 'LOGOUT', 'user', '2026-09-29 11:48:40', 'Admin logged out.', 'No'),
(351, 5, 'LOGIN', 'user', '2026-09-29 11:48:53', 'Admin logged in.', 'No'),
(352, 1, 'LOGIN', 'user', '2026-09-29 11:50:23', 'Admin logged in.', 'No'),
(353, 5, 'LOGIN', 'user', '2026-09-29 12:06:14', 'Admin logged in.', 'No'),
(354, 5, 'INSERT', 'purchase_order', '2026-09-29 12:47:36', 'Created PO #5 with 1 item(s).', 'No'),
(355, 1, 'UPDATE', 'purchase_order', '2026-09-29 12:51:44', 'Changed Purchase Order to MegaFoods Distribution Inc. (2026-09-29) status to Approved', 'No'),
(356, 5, 'LOGOUT', 'user', '2026-09-29 12:52:39', 'User logged out.', 'No'),
(357, 5, 'LOGOUT', 'user', '2026-09-29 12:53:16', 'User logged out.', 'No'),
(358, 1, 'LOGIN', 'user', '2026-09-29 12:53:25', 'Admin logged in.', 'No'),
(359, 1, 'UNARCHIVE', 'user', '2026-09-29 12:53:43', 'Restored User: jenn', 'No'),
(360, 2, 'LOGIN', 'user', '2026-09-29 12:54:00', 'Admin logged in.', 'No'),
(361, 2, 'LOGIN', 'user', '2026-09-29 13:05:23', 'Admin logged in.', 'No'),
(362, 1, 'LOGOUT', 'user', '2026-09-29 13:05:42', 'Admin logged out.', 'No'),
(363, 2, 'LOGIN', 'user', '2026-09-29 13:07:02', 'Admin logged in.', 'No'),
(364, 2, 'LOGOUT', 'user', '2026-09-30 23:23:56', 'Admin logged out.', 'No'),
(365, 2, 'LOGIN', 'user', '2026-09-30 23:24:13', 'Admin logged in.', 'No'),
(366, 2, 'LOGOUT', 'user', '2026-09-30 23:32:52', 'Receiving staff logged out.', 'No'),
(367, 1, 'LOGIN', 'user', '2026-09-30 23:33:01', 'Admin logged in.', 'No'),
(368, 1, 'LOGOUT', 'user', '2026-09-30 23:47:59', 'Admin logged out.', 'No'),
(369, 2, 'LOGIN', 'user', '2026-09-30 23:48:08', 'Admin logged in.', 'No'),
(370, 2, 'LOGOUT', 'user', '2026-09-30 23:48:46', 'Admin logged out.', 'No'),
(371, 1, 'LOGIN', 'user', '2026-09-30 23:48:55', 'Admin logged in.', 'No'),
(372, 1, 'LOGOUT', 'user', '2026-09-30 23:59:38', 'Receiving staff logged out.', 'No'),
(373, 1, 'LOGIN', 'user', '2026-09-30 23:59:51', 'Admin logged in.', 'No'),
(374, 1, 'LOGOUT', 'user', '2026-09-30 23:59:59', 'Receiving staff logged out.', 'No'),
(375, 2, 'LOGIN', 'user', '2026-10-01 00:00:12', 'Admin logged in.', 'No'),
(376, 1, 'LOGOUT', 'user', '2026-10-01 00:00:46', 'Receiving staff logged out.', 'No'),
(377, 2, 'LOGIN', 'user', '2026-10-01 00:01:03', 'Admin logged in.', 'No'),
(378, 2, 'LOGIN', 'user', '2026-10-01 00:05:42', 'Admin logged in.', 'No'),
(379, 2, 'LOGOUT', 'user', '2026-10-01 00:05:59', 'Receiving staff logged out.', 'No'),
(380, 2, 'LOGOUT', 'user', '2026-10-01 00:08:22', 'Receiving staff logged out.', 'No'),
(381, 2, 'LOGIN', 'user', '2026-10-01 00:08:31', 'Admin logged in.', 'No'),
(382, 2, 'LOGIN', 'user', '2026-10-01 00:09:59', 'Admin logged in.', 'No'),
(383, 2, 'LOGIN', 'user', '2026-10-01 00:11:45', 'Admin logged in.', 'No'),
(384, 2, 'LOGIN', 'user', '2026-10-01 00:21:05', 'Admin logged in.', 'No'),
(385, 2, 'LOGIN', 'user', '2026-10-01 00:21:32', 'Admin logged in.', 'No'),
(386, 2, 'INSERT', 'receiving', '2026-10-01 00:22:01', 'Created Receiving #8', 'No'),
(387, 2, 'UPDATE', 'receiving', '2026-10-01 00:22:45', 'Updated Receiving #8', 'No'),
(388, 2, 'LOGOUT', 'user', '2026-10-01 00:22:55', 'Receiving staff logged out.', 'No'),
(389, 1, 'LOGIN', 'user', '2026-10-01 00:23:02', 'Admin logged in.', 'No'),
(390, 1, 'LOGOUT', 'user', '2026-10-01 00:24:08', 'Admin logged out.', 'No'),
(391, 3, 'LOGIN', 'user', '2026-10-01 00:24:21', 'Admin logged in.', 'No'),
(392, 3, 'LOGOUT', 'user', '2026-10-01 00:24:38', 'Manager logged out.', 'No'),
(393, 4, 'LOGIN', 'user', '2026-10-01 00:24:55', 'Admin logged in.', 'No'),
(394, 4, 'LOGOUT', 'user', '2026-10-01 01:02:29', 'Inventory Staff logged out.', 'No'),
(395, 2, 'LOGIN', 'user', '2026-10-01 01:02:48', 'Admin logged in.', 'No'),
(396, 2, 'LOGOUT', 'user', '2026-10-01 01:03:00', 'Admin logged out.', 'No'),
(397, 4, 'LOGIN', 'user', '2026-10-01 01:03:11', 'Admin logged in.', 'No'),
(398, 4, 'LOGOUT', 'user', '2026-10-01 01:06:27', 'Inventory Staff logged out.', 'No'),
(399, 5, 'LOGIN', 'user', '2026-10-01 01:06:40', 'Admin logged in.', 'No'),
(400, 5, 'LOGOUT', 'user', '2026-10-01 01:25:12', 'Receiving staff logged out.', 'No'),
(401, 2, 'LOGIN', 'user', '2026-10-01 01:25:27', 'Admin logged in.', 'No'),
(402, 2, 'LOGOUT', 'user', '2026-10-01 01:26:16', 'Admin logged out.', 'No'),
(403, 1, 'LOGIN', 'user', '2026-10-01 01:26:22', 'Admin logged in.', 'No'),
(404, 1, 'LOGIN', 'user', '2026-10-01 09:01:02', 'Admin logged in.', 'No'),
(405, 1, 'LOGOUT', 'user', '2026-10-01 09:01:14', 'Admin logged out.', 'No'),
(406, 3, 'LOGIN', 'user', '2026-10-01 09:01:22', 'Admin logged in.', 'No'),
(407, 3, 'LOGOUT', 'user', '2026-10-01 09:01:30', 'Admin logged out.', 'No'),
(408, 2, 'LOGIN', 'user', '2026-10-01 09:01:38', 'Admin logged in.', 'No'),
(409, 2, 'LOGOUT', 'user', '2026-10-01 09:01:53', 'Admin logged out.', 'No'),
(410, 4, 'LOGIN', 'user', '2026-10-01 09:02:19', 'Admin logged in.', 'No'),
(411, 4, 'LOGOUT', 'user', '2026-10-01 09:02:29', 'Admin logged out.', 'No'),
(412, 5, 'LOGIN', 'user', '2026-10-01 09:02:52', 'Admin logged in.', 'No'),
(413, 5, 'INSERT', 'purchase_order', '2026-10-01 09:04:55', 'Created PO #6 with 1 item(s).', 'No'),
(414, 1, 'LOGIN', 'user', '2026-10-01 09:25:12', 'Admin logged in.', 'No'),
(415, 1, 'INSERT', 'role', '2026-10-01 09:25:44', 'Added Role: Releasing Staff', 'No'),
(416, 1, 'INSERT', 'user', '2026-10-01 09:33:05', 'Added User: release', 'No'),
(417, 7, 'LOGIN', 'user', '2026-10-01 09:34:59', 'Admin logged in.', 'No'),
(418, 7, 'LOGIN', 'user', '2026-10-01 09:36:21', 'Admin logged in.', 'No'),
(419, 7, 'LOGIN', 'user', '2026-10-01 09:36:45', 'Admin logged in.', 'No'),
(420, 1, 'LOGIN', 'user', '2026-10-01 13:25:25', 'Admin logged in.', 'No'),
(421, 1, 'LOGOUT', 'user', '2026-10-01 13:28:24', 'Admin logged out.', 'No'),
(422, 2, 'LOGIN', 'user', '2026-10-01 13:28:38', 'Admin logged in.', 'No'),
(423, 2, 'LOGOUT', 'user', '2026-10-01 13:29:38', 'Admin logged out.', 'No'),
(424, 3, 'LOGIN', 'user', '2026-10-01 13:30:08', 'Admin logged in.', 'No'),
(425, 3, 'LOGOUT', 'user', '2026-10-01 13:30:58', 'Admin logged out.', 'No'),
(426, 5, 'LOGIN', 'user', '2026-10-01 13:31:16', 'Admin logged in.', 'No'),
(427, 5, 'LOGOUT', 'user', '2026-10-01 13:31:47', 'User logged out.', 'No'),
(428, 4, 'LOGIN', 'user', '2026-10-01 13:32:03', 'Admin logged in.', 'No'),
(429, 4, 'LOGOUT', 'user', '2026-10-01 13:38:19', 'Inventory Staff logged out.', 'No'),
(430, 1, 'LOGIN', 'user', '2026-10-01 13:39:34', 'Admin logged in.', 'No'),
(431, 1, 'UPDATE', 'purchase_order', '2026-10-01 14:02:00', 'Changed Purchase Order to Fresh Dairy Co. (2026-10-01) status to Approved', 'No'),
(432, 1, 'UPDATE', 'receiving', '2026-10-01 14:02:25', 'Changed Receiving from MegaFoods Distribution Inc. (2026-09-30) status to Cancelled', 'No'),
(433, 1, 'UPDATE', 'purchase_order', '2026-10-01 14:06:05', 'Changed Purchase Order to Fresh Dairy Co. (2026-10-01) status to Pending', 'No'),
(434, 1, 'LOGIN', 'user', '2026-10-01 14:19:48', 'Admin logged in.', 'No'),
(435, 2, 'LOGOUT', 'user', '2026-10-01 14:20:51', 'Receiving staff logged out.', 'No'),
(436, 1, 'LOGIN', 'user', '2026-10-01 14:20:58', 'Admin logged in.', 'No'),
(437, 1, 'LOGOUT', 'user', '2026-10-01 14:21:24', 'Admin logged out.', 'No'),
(438, 1, 'LOGIN', 'user', '2026-10-01 14:21:32', 'Admin logged in.', 'No'),
(439, 1, 'UPDATE', 'inventory_adjustment', '2026-10-01 14:21:54', 'Changed Inventory Adjustment by jennie redondo (Reason: secret) status to Approved', 'No'),
(440, 1, 'UPDATE', 'inventory_adjustment', '2026-10-01 14:21:58', 'Changed Inventory Adjustment by jennie redondo (Reason: secret) status to Pending', 'No'),
(441, 1, 'UPDATE', 'purchase_order', '2026-10-01 14:25:21', 'Changed Purchase Order to MegaFoods Distribution Inc. (2026-09-29) status to Pending', 'No'),
(442, 1, 'UPDATE', 'purchase_order', '2026-10-01 14:25:24', 'Changed Purchase Order to National Grains Supply (2026-09-01) status to Pending', 'No'),
(443, 1, 'UPDATE', 'purchase_order', '2026-10-01 14:25:27', 'Changed Purchase Order to Fresh Dairy Co. (2026-08-10) status to Pending', 'No'),
(444, 1, 'UPDATE', 'receiving', '2026-10-01 14:25:33', 'Changed Receiving from MegaFoods Distribution Inc. (2026-09-30) status to Pending', 'No'),
(445, 1, 'UPDATE', 'receiving', '2026-10-01 14:25:36', 'Changed Receiving from Fresh Dairy Co. (2026-09-17) status to Pending', 'No'),
(446, 1, 'UPDATE', 'receiving', '2026-10-01 14:25:39', 'Changed Receiving from Fresh Dairy Co. (2026-08-12) status to Pending', 'No'),
(447, 1, 'UPDATE', 'stock_release', '2026-10-01 14:25:45', 'Changed Stock Release requested by John Sayson status to Pending', 'No'),
(448, 1, 'UPDATE', 'stock_release', '2026-10-01 14:25:48', 'Changed Stock Release requested by jennie redondo status to Pending', 'No'),
(449, 1, 'UPDATE', 'stock_return', '2026-10-01 14:25:57', 'Changed Stock Return by jennie redondo (Reason: expired) status to Pending', 'No'),
(450, 1, 'UPDATE', 'stock_return', '2026-10-01 14:26:00', 'Changed Stock Return by jennie redondo (Reason: Sobra nga stock nga gi-release, gi-balik sa warehouse) status to Approved', 'No'),
(451, 1, 'UPDATE', 'inventory_adjustment', '2026-10-01 14:26:10', 'Changed Inventory Adjustment by jennie redondo (Reason: secret) status to Pending', 'No'),
(452, 1, 'UPDATE', 'inventory_adjustment', '2026-10-01 14:26:14', 'Changed Inventory Adjustment by jelian saguing (Reason: Nakit-an nga damaged items sa bodega) status to Approved', 'No'),
(453, 1, 'CANCEL', 'purchase_order', '2026-10-01 14:32:05', 'Cancelled PO #5.', 'No'),
(454, 1, 'INSERT', 'purchase_order', '2026-10-01 14:33:50', 'Created PO #7 with 1 item(s).', 'No'),
(455, 1, 'UPDATE', 'inventory_adjustment', '2026-10-01 14:46:01', 'Changed Inventory Adjustment by jennie redondo (Reason: secret) status to Approved', 'No'),
(456, 1, 'LOGOUT', 'user', '2026-10-01 15:10:40', 'Admin logged out.', 'No'),
(457, 3, 'LOGIN', 'user', '2026-10-01 15:10:49', 'Admin logged in.', 'No'),
(458, 3, 'LOGOUT', 'user', '2026-10-01 15:11:51', 'User logged out.', 'No'),
(459, 5, 'LOGIN', 'user', '2026-10-01 15:12:10', 'Admin logged in.', 'No'),
(460, 1, 'LOGOUT', 'user', '2026-10-01 15:53:06', 'Admin logged out.', 'No'),
(461, 5, 'LOGIN', 'user', '2026-10-01 15:53:27', 'Admin logged in.', 'No'),
(462, 5, 'LOGIN', 'user', '2026-10-01 16:31:58', 'Admin logged in.', 'No'),
(463, 5, 'INSERT', 'purchase_return', '2026-10-01 16:33:40', 'Created purchase return #4 for PO #4.', 'No'),
(464, 5, 'LOGOUT', 'user', '2026-10-01 16:44:38', 'User logged out.', 'No'),
(465, 3, 'LOGIN', 'user', '2026-10-01 16:44:48', 'Admin logged in.', 'No'),
(466, 5, 'LOGOUT', 'user', '2026-10-02 00:17:34', 'User logged out.', 'No'),
(467, 7, 'LOGIN', 'user', '2026-10-02 00:18:26', 'Admin logged in.', 'No'),
(468, 7, 'LOGIN', 'user', '2026-10-02 00:18:43', 'Admin logged in.', 'No'),
(469, 7, 'LOGIN', 'user', '2026-10-02 00:24:02', 'Admin logged in.', 'No'),
(470, 7, 'LOGIN', 'user', '2026-10-02 00:24:06', 'Admin logged in.', 'No'),
(471, 7, 'LOGIN', 'user', '2026-10-02 00:24:44', 'Admin logged in.', 'No'),
(472, 7, 'LOGIN', 'user', '2026-10-02 00:25:18', 'Admin logged in.', 'No'),
(473, 7, 'LOGIN', 'user', '2026-10-02 00:25:33', 'Admin logged in.', 'No'),
(474, 7, 'LOGIN', 'user', '2026-10-02 00:29:07', 'Admin logged in.', 'No'),
(475, 7, 'LOGIN', 'user', '2026-10-02 00:29:39', 'Admin logged in.', 'No'),
(476, 7, 'LOGIN', 'user', '2026-10-02 00:29:57', 'Admin logged in.', 'No'),
(477, 7, 'LOGIN', 'user', '2026-10-02 00:29:59', 'Admin logged in.', 'No'),
(478, 7, 'LOGIN', 'user', '2026-10-02 00:29:59', 'Admin logged in.', 'No'),
(479, 7, 'LOGIN', 'user', '2026-10-02 00:32:36', 'Admin logged in.', 'No'),
(480, 7, 'LOGIN', 'user', '2026-10-02 00:32:47', 'Admin logged in.', 'No'),
(481, 7, 'LOGIN', 'user', '2026-10-02 00:32:59', 'Admin logged in.', 'No'),
(482, 7, 'LOGIN', 'user', '2026-10-02 00:33:05', 'Admin logged in.', 'No'),
(483, 7, 'LOGIN', 'user', '2026-10-02 00:33:44', 'Admin logged in.', 'No'),
(484, 7, 'LOGOUT', 'user', '2026-10-02 00:34:13', 'Releasing staff logged out.', 'No'),
(485, 1, 'LOGIN', 'user', '2026-10-02 00:34:18', 'Admin logged in.', 'No'),
(486, 7, 'LOGIN', 'user', '2026-10-02 00:36:08', 'Admin logged in.', 'No'),
(487, 7, 'LOGIN', 'user', '2026-10-02 00:36:18', 'Admin logged in.', 'No'),
(488, 1, 'LOGOUT', 'user', '2026-10-02 00:38:07', 'Admin logged out.', 'No'),
(489, 3, 'LOGIN', 'user', '2026-10-02 00:38:15', 'Admin logged in.', 'No'),
(490, 3, 'LOGOUT', 'user', '2026-10-02 00:39:26', 'Admin logged out.', 'No'),
(491, 1, 'LOGIN', 'user', '2026-10-02 00:39:30', 'Admin logged in.', 'No'),
(492, 3, 'LOGIN', 'user', '2026-10-02 00:39:47', 'Admin logged in.', 'No'),
(493, 2, 'LOGIN', 'user', '2026-10-02 00:41:50', 'Admin logged in.', 'No'),
(494, 2, 'LOGOUT', 'user', '2026-10-02 00:42:36', 'Receiving staff logged out.', 'No'),
(495, 3, 'LOGIN', 'user', '2026-10-02 00:42:53', 'Admin logged in.', 'No'),
(496, 3, 'LOGIN', 'user', '2026-10-02 00:43:14', 'Admin logged in.', 'No'),
(497, 3, 'LOGIN', 'user', '2026-10-02 00:43:53', 'Admin logged in.', 'No'),
(498, 1, 'LOGIN', 'user', '2026-10-02 00:44:43', 'Admin logged in.', 'No'),
(499, 2, 'LOGIN', 'user', '2026-10-02 00:45:12', 'Admin logged in.', 'No'),
(500, 7, 'LOGIN', 'user', '2026-10-02 00:45:46', 'Admin logged in.', 'No'),
(501, 7, 'LOGIN', 'user', '2026-10-02 00:46:05', 'Admin logged in.', 'No'),
(502, 7, 'LOGIN', 'user', '2026-10-02 00:51:33', 'Admin logged in.', 'No'),
(503, 1, 'LOGIN', 'user', '2026-10-02 00:52:45', 'Admin logged in.', 'No'),
(504, 3, 'LOGIN', 'user', '2026-10-02 00:53:07', 'Admin logged in.', 'No'),
(505, 3, 'LOGIN', 'user', '2026-10-02 00:53:56', 'Admin logged in.', 'No'),
(506, 5, 'LOGIN', 'user', '2026-10-02 00:54:18', 'Admin logged in.', 'No'),
(507, 2, 'LOGIN', 'user', '2026-10-02 00:54:48', 'Admin logged in.', 'No'),
(508, 4, 'LOGIN', 'user', '2026-10-02 00:55:54', 'Admin logged in.', 'No'),
(509, 5, 'LOGIN', 'user', '2026-10-02 00:56:52', 'Admin logged in.', 'No'),
(510, 5, 'LOGIN', 'user', '2026-10-02 00:57:00', 'Admin logged in.', 'No'),
(511, 5, 'LOGIN', 'user', '2026-10-02 00:57:15', 'Admin logged in.', 'No'),
(512, 3, 'LOGIN', 'user', '2026-10-02 00:57:54', 'Admin logged in.', 'No'),
(513, 5, 'LOGIN', 'user', '2026-10-02 01:04:07', 'Admin logged in.', 'No'),
(514, 1, 'LOGIN', 'user', '2026-10-02 01:04:18', 'Admin logged in.', 'No'),
(515, 3, 'LOGIN', 'user', '2026-10-02 01:04:30', 'Admin logged in.', 'No'),
(516, 2, 'LOGIN', 'user', '2026-10-02 01:05:04', 'Admin logged in.', 'No'),
(517, 4, 'LOGIN', 'user', '2026-10-02 01:05:23', 'Admin logged in.', 'No'),
(518, 7, 'LOGIN', 'user', '2026-10-02 01:05:38', 'Admin logged in.', 'No'),
(519, 3, 'LOGIN', 'user', '2026-10-02 12:14:42', 'Admin logged in.', 'No'),
(520, 7, 'LOGIN', 'user', '2026-10-02 12:22:44', 'Admin logged in.', 'No'),
(521, 1, 'LOGIN', 'user', '2026-10-02 12:43:58', 'Admin logged in.', 'No'),
(522, 5, 'LOGIN', 'user', '2026-10-02 12:44:35', 'Admin logged in.', 'No'),
(523, 7, 'LOGIN', 'user', '2026-10-02 12:55:09', 'Admin logged in.', 'No'),
(524, 7, 'LOGIN', 'user', '2026-10-02 12:56:46', 'Admin logged in.', 'No'),
(525, 7, 'LOGIN', 'user', '2026-10-02 12:56:55', 'Admin logged in.', 'No'),
(526, 7, 'LOGIN', 'user', '2026-10-02 12:57:09', 'Admin logged in.', 'No'),
(527, 7, 'LOGIN', 'user', '2026-10-02 12:57:25', 'Admin logged in.', 'No'),
(528, 7, 'LOGIN', 'user', '2026-10-02 12:57:51', 'Admin logged in.', 'No'),
(529, 7, 'LOGIN', 'user', '2026-10-02 12:58:26', 'Admin logged in.', 'No'),
(530, 7, 'LOGIN', 'user', '2026-10-02 12:58:53', 'Admin logged in.', 'No'),
(531, 7, 'INSERT', 'stock_release', '2026-10-02 13:00:45', 'Created and completed stock release #4.', 'No'),
(532, 7, 'INSERT', 'stock_release', '2026-10-02 13:02:14', 'Created and completed stock release #5.', 'No'),
(533, 3, 'LOGIN', 'user', '2026-10-02 13:02:55', 'Admin logged in.', 'No'),
(534, 1, 'LOGIN', 'user', '2026-10-02 13:04:04', 'Admin logged in.', 'No'),
(535, 3, 'LOGIN', 'user', '2026-10-02 13:04:40', 'Admin logged in.', 'No'),
(536, 7, 'LOGIN', 'user', '2026-10-02 13:05:24', 'Admin logged in.', 'No'),
(537, 4, 'LOGIN', 'user', '2026-10-02 13:05:38', 'Admin logged in.', 'No'),
(538, 2, 'LOGIN', 'user', '2026-10-02 13:06:20', 'Admin logged in.', 'No'),
(539, 5, 'LOGIN', 'user', '2026-10-02 13:06:43', 'Admin logged in.', 'No'),
(540, 5, 'LOGOUT', 'user', '2026-10-02 13:07:04', 'Admin logged out.', 'No'),
(541, 1, 'LOGIN', 'user', '2026-10-02 13:07:11', 'Admin logged in.', 'No'),
(542, 1, 'INSERT', 'product', '2026-10-02 13:08:39', 'Added Product: Milo 500 g', 'No'),
(543, 1, 'INSERT', 'supplier_product', '2026-10-02 13:09:34', 'Linked Product: Milo 500 g to Supplier: CleanHome Supplies Corp', 'No'),
(544, 5, 'LOGIN', 'user', '2026-10-02 13:10:01', 'Admin logged in.', 'No'),
(545, 5, 'LOGOUT', 'user', '2026-10-02 13:18:36', 'Admin logged out.', 'No'),
(546, 1, 'LOGIN', 'user', '2026-10-02 13:18:42', 'Admin logged in.', 'No'),
(547, 1, 'LOGIN', 'user', '2026-10-02 13:53:13', 'Admin logged in.', 'No'),
(548, 3, 'LOGIN', 'user', '2026-10-02 13:53:28', 'Admin logged in.', 'No'),
(549, 5, 'LOGIN', 'user', '2026-10-02 13:53:40', 'Admin logged in.', 'No'),
(550, 2, 'LOGIN', 'user', '2026-10-02 13:54:08', 'Admin logged in.', 'No'),
(551, 2, 'LOGIN', 'user', '2026-10-02 13:54:19', 'Admin logged in.', 'No'),
(552, 1, 'LOGIN', 'user', '2026-10-02 14:03:36', 'Admin logged in.', 'No'),
(553, 5, 'LOGIN', 'user', '2026-10-02 14:03:48', 'Admin logged in.', 'No'),
(554, 7, 'LOGIN', 'user', '2026-10-02 14:04:21', 'Admin logged in.', 'No'),
(555, 3, 'LOGIN', 'user', '2026-10-02 14:04:34', 'Admin logged in.', 'No'),
(556, 2, 'LOGIN', 'user', '2026-10-02 14:04:50', 'Admin logged in.', 'No'),
(557, 4, 'LOGIN', 'user', '2026-10-02 14:05:18', 'Admin logged in.', 'No'),
(558, 5, 'INSERT', 'purchase_order', '2026-10-02 14:06:07', 'Created PO #8 with 1 item(s).', 'No'),
(559, 1, 'UPDATE', 'purchase_order', '2026-10-02 14:06:36', 'Changed Purchase Order to CleanHome Supplies Corp (2026-10-02) status to Approved', 'No'),
(560, 2, 'INSERT', 'receiving', '2026-10-02 14:07:41', 'Created Receiving #9', 'No'),
(561, 4, 'INSERT', 'inventory_adjustment', '2026-10-02 14:09:47', 'Created adjustment #5 for ProductID: 13', 'No'),
(562, 3, 'APPROVED', 'inventory_adjustment', '2026-10-02 14:10:38', 'Approved inventory adjustment #5.', 'No'),
(563, 7, 'LOGOUT', 'user', '2026-10-02 14:27:32', 'Admin logged out.', 'No'),
(564, 1, 'LOGIN', 'user', '2026-10-02 14:27:38', 'Admin logged in.', 'No'),
(565, 1, 'LOGIN', 'user', '2026-10-02 14:27:45', 'Admin logged in.', 'No'),
(566, 1, 'LOGIN', 'user', '2026-10-02 14:28:33', 'Admin logged in.', 'No'),
(567, 1, 'LOGIN', 'user', '2026-10-02 14:30:33', 'Admin logged in.', 'No'),
(568, 5, 'LOGOUT', 'user', '2026-10-02 14:55:08', 'User logged out.', 'No'),
(569, 5, 'LOGIN', 'user', '2026-10-02 14:55:14', 'Admin logged in.', 'No'),
(570, 5, 'LOGIN', 'user', '2026-10-02 15:03:52', 'Admin logged in.', 'No'),
(571, 1, 'LOGIN', 'user', '2026-10-02 17:47:31', 'Admin logged in.', 'No'),
(572, 7, 'LOGIN', 'user', '2026-10-02 17:48:50', 'Admin logged in.', 'No'),
(573, 3, 'LOGIN', 'user', '2026-10-02 17:49:37', 'Admin logged in.', 'No'),
(574, 5, 'LOGIN', 'user', '2026-10-02 17:50:53', 'Admin logged in.', 'No'),
(575, 4, 'LOGIN', 'user', '2026-10-02 17:51:20', 'Admin logged in.', 'No'),
(576, 2, 'LOGIN', 'user', '2026-10-02 17:51:39', 'Admin logged in.', 'No'),
(577, 2, 'LOGIN', 'user', '2026-10-02 17:51:57', 'Admin logged in.', 'No'),
(578, 2, 'LOGIN', 'user', '2026-10-02 17:52:20', 'Admin logged in.', 'No'),
(579, 2, 'LOGIN', 'user', '2026-10-02 17:52:46', 'Admin logged in.', 'No'),
(580, 2, 'LOGIN', 'user', '2026-10-02 17:53:08', 'Admin logged in.', 'No'),
(581, 2, 'LOGIN', 'user', '2026-10-02 17:53:30', 'Admin logged in.', 'No'),
(582, 1, 'LOGIN', 'user', '2026-10-02 17:54:25', 'Admin logged in.', 'No'),
(583, 3, 'LOGIN', 'user', '2026-10-02 17:54:50', 'Admin logged in.', 'No'),
(584, 4, 'LOGIN', 'user', '2026-10-02 17:55:17', 'Admin logged in.', 'No'),
(585, 7, 'LOGIN', 'user', '2026-10-02 17:55:32', 'Admin logged in.', 'No'),
(586, 5, 'LOGIN', 'user', '2026-10-02 17:55:55', 'Admin logged in.', 'No'),
(587, 1, 'INSERT', 'product', '2026-10-02 17:57:17', 'Added Product: Bear Brand', 'No'),
(588, 1, 'INSERT', 'supplier_product', '2026-10-02 17:57:54', 'Linked Product: Bear Brand to Supplier: Fresh Dairy Co.', 'No'),
(589, 5, 'INSERT', 'purchase_order', '2026-10-02 17:58:55', 'Created PO #9 with 1 item(s).', 'No');
INSERT INTO `auditlog` (`AuditLogID`, `UserID`, `ActionType`, `TableAffected`, `ActionTimestamp`, `Details`, `IsArchived`) VALUES
(590, 1, 'UPDATE', 'purchase_order', '2026-10-02 17:59:36', 'Changed Purchase Order to Fresh Dairy Co. (2026-10-02) status to Approved', 'No'),
(591, 2, 'INSERT', 'receiving', '2026-10-02 18:00:31', 'Created Receiving #10', 'No'),
(592, 4, 'INSERT', 'inventory_adjustment', '2026-10-02 18:04:42', 'Created adjustment #6 for ProductID: 14', 'No'),
(593, 3, 'APPROVED', 'inventory_adjustment', '2026-10-02 18:06:03', 'Approved inventory adjustment #6.', 'No'),
(594, 4, 'INSERT', 'inventory_adjustment', '2026-10-02 18:50:50', 'Created adjustment #7 for ProductID: 14', 'No'),
(595, 3, 'APPROVED', 'inventory_adjustment', '2026-10-02 18:51:17', 'Approved inventory adjustment #7.', 'No'),
(596, 7, 'INSERT', 'stock_release', '2026-10-02 18:52:10', 'Created and completed stock release #6.', 'No'),
(597, 7, 'LOGIN', 'user', '2026-10-02 18:53:23', 'Admin logged in.', 'No'),
(598, 7, 'INSERT', 'stock_release', '2026-10-02 20:18:17', 'Created and completed stock release #7.', 'No'),
(599, 1, 'INSERT', 'supplier', '2026-10-02 20:19:19', 'Added Supplier: jen inc.', 'No'),
(600, 1, 'INSERT', 'supplier_product', '2026-10-02 20:19:36', 'Linked Product: bombay to Supplier: jen inc.', 'No'),
(601, 1, 'ARCHIVE', 'supplier_product', '2026-10-02 20:19:45', 'Removed supplier-product link #15', 'No'),
(602, 1, 'INSERT', 'supplier_product', '2026-10-02 20:20:34', 'Linked Product: Alaska Fresh Milk 1L to Supplier: jen inc.', 'No'),
(603, 1, 'ARCHIVE', 'supplier_product', '2026-10-02 20:20:38', 'Removed supplier-product link #19', 'No'),
(604, 1, 'ARCHIVE', 'supplier_product', '2026-10-02 20:33:26', 'Removed supplier-product link #19', 'No'),
(605, 4, 'INSERT', 'inventory_adjustment', '2026-10-02 20:41:18', 'Created adjustment #8 for ProductID: 4', 'No'),
(606, 4, 'UPDATE', 'stock_return', '2026-10-02 20:43:19', 'Updated stock return #3', 'No'),
(607, 1, 'LOGIN', 'user', '2026-10-02 21:00:25', 'Admin logged in.', 'No'),
(608, 3, 'APPROVED', 'inventory_adjustment', '2026-10-02 21:12:26', 'Approved inventory adjustment #8.', 'No'),
(609, 1, 'INSERT', 'product', '2026-10-02 21:22:40', 'Added Product: C2 APPLE', 'No'),
(610, 1, 'INSERT', 'supplier_product', '2026-10-02 21:23:25', 'Linked Product: C2 APPLE to Supplier: MegaFoods Distribution Inc.', 'No'),
(611, 5, 'INSERT', 'purchase_order', '2026-10-02 21:24:51', 'Created PO #10 with 1 item(s).', 'No'),
(612, 1, 'UPDATE', 'purchase_order', '2026-10-02 21:25:45', 'Changed Purchase Order to MegaFoods Distribution Inc. (2026-10-02) status to Approved', 'No'),
(613, 2, 'LOGIN', 'user', '2026-10-02 21:28:16', 'Admin logged in.', 'No'),
(614, 2, 'INSERT', 'receiving', '2026-10-02 21:29:11', 'Created Receiving #11', 'No'),
(615, 4, 'INSERT', 'inventory_adjustment', '2026-10-02 21:30:41', 'Created adjustment #9 for ProductID: 4', 'No'),
(616, 3, 'APPROVED', 'inventory_adjustment', '2026-10-02 21:31:45', 'Approved inventory adjustment #9.', 'No'),
(617, 2, 'LOGOUT', 'user', '2026-10-02 21:32:21', 'Receiving staff logged out.', 'No'),
(618, 3, 'LOGIN', 'user', '2026-10-02 21:32:36', 'Admin logged in.', 'No'),
(619, 4, 'INSERT', 'inventory_adjustment', '2026-10-02 21:33:58', 'Created adjustment #10 for ProductID: 15', 'No'),
(620, 3, 'APPROVED', 'inventory_adjustment', '2026-10-02 21:34:10', 'Approved inventory adjustment #10.', 'No'),
(621, 7, 'INSERT', 'stock_release', '2026-10-02 21:34:44', 'Created and completed stock release #8.', 'No'),
(622, 4, 'INSERT', 'inventory_adjustment', '2026-10-02 21:36:51', 'Created adjustment #11 for ProductID: 4', 'No'),
(623, 2, 'INSERT', 'receiving', '2026-10-02 21:37:25', 'Created Receiving #12', 'No'),
(624, 2, 'INSERT', 'receiving', '2026-10-02 22:03:35', 'Created Receiving #13', 'No'),
(625, 2, 'INSERT', 'receiving', '2026-10-02 22:12:54', 'Created Receiving #14', 'No'),
(626, 2, 'INSERT', 'receiving', '2026-10-02 22:13:25', 'Created Receiving #15', 'No'),
(627, 4, 'LOGIN', 'user', '2026-10-02 22:24:52', 'Admin logged in.', 'No'),
(628, 4, 'LOGIN', 'user', '2026-10-02 22:25:16', 'Admin logged in.', 'No'),
(629, 4, 'INSERT', 'inventory_adjustment', '2026-10-02 22:26:04', 'Created adjustment #12 for ProductID: 1', 'No'),
(630, 4, 'LOGIN', 'user', '2026-10-03 08:26:16', 'Admin logged in.', 'No'),
(631, 4, 'INSERT', 'inventory_adjustment', '2026-10-03 08:26:45', 'Created adjustment #13 for ProductID: 4', 'No'),
(632, 4, 'INSERT', 'inventory_adjustment', '2026-10-03 08:27:50', 'Created adjustment #14 for ProductID: 4', 'No'),
(633, 3, 'LOGIN', 'user', '2026-10-03 08:31:16', 'Admin logged in.', 'No'),
(634, 3, 'APPROVED', 'inventory_adjustment', '2026-10-03 08:32:36', 'Approved inventory adjustment #14.', 'No'),
(635, 7, 'LOGIN', 'user', '2026-10-03 09:09:59', 'Admin logged in.', 'No'),
(636, 1, 'LOGIN', 'user', '2026-10-03 10:02:28', 'Admin logged in.', 'No'),
(637, 4, 'LOGIN', 'user', '2026-10-03 10:02:44', 'Admin logged in.', 'No'),
(638, 3, 'LOGIN', 'user', '2026-10-03 10:02:59', 'Admin logged in.', 'No'),
(639, 7, 'LOGIN', 'user', '2026-10-03 10:03:27', 'Admin logged in.', 'No'),
(640, 2, 'LOGIN', 'user', '2026-10-03 10:06:11', 'Admin logged in.', 'No'),
(641, 5, 'LOGIN', 'user', '2026-10-03 10:07:54', 'Admin logged in.', 'No'),
(642, 1, 'LOGIN', 'user', '2026-10-03 13:14:25', 'Admin logged in.', 'No'),
(643, 3, 'LOGIN', 'user', '2026-10-03 13:14:50', 'Admin logged in.', 'No'),
(644, 1, 'ARCHIVE', 'category', '2026-10-03 13:15:21', 'Archived Category: Snacks', 'No'),
(645, 1, 'UNARCHIVE', 'category', '2026-10-03 13:15:26', 'Restored Category: Snacks', 'No'),
(646, 1, 'LOGIN', 'user', '2026-10-03 13:49:41', 'Admin logged in.', 'No'),
(647, 3, 'LOGIN', 'user', '2026-10-03 13:51:42', 'Admin logged in.', 'No'),
(648, 2, 'LOGIN', 'user', '2026-10-03 13:52:04', 'Admin logged in.', 'No'),
(649, 5, 'LOGIN', 'user', '2026-10-03 13:52:20', 'Admin logged in.', 'No'),
(650, 7, 'LOGIN', 'user', '2026-10-03 13:52:33', 'Admin logged in.', 'No'),
(651, 4, 'LOGIN', 'user', '2026-10-03 13:52:57', 'Admin logged in.', 'No'),
(652, 5, 'LOGIN', 'user', '2026-10-03 13:56:08', 'Admin logged in.', 'No'),
(653, 1, 'INSERT', 'supplier_product', '2026-10-03 13:57:01', 'Linked Product: Bear Brand to Supplier: jen inc.', 'No'),
(654, 1, 'INSERT', 'supplier_product', '2026-10-03 13:57:37', 'Linked Product: bombay to Supplier: CleanHome Supplies Corp', 'No'),
(655, 1, 'INSERT', 'supplier_product', '2026-10-03 13:59:08', 'Linked Product: Bear Brand to Supplier: CleanHome Supplies Corp', 'No'),
(656, 5, 'INSERT', 'purchase_order', '2026-10-03 14:04:27', 'Created PO #11 with 3 item(s).', 'No'),
(657, 1, 'UPDATE', 'purchase_order', '2026-10-03 14:05:58', 'Changed Purchase Order to CleanHome Supplies Corp (2026-10-03) status to Approved', 'No'),
(658, 2, 'INSERT', 'receiving', '2026-10-03 14:10:31', 'Created Receiving #16', 'No'),
(659, 1, 'LOGIN', 'user', '2026-10-04 17:44:41', 'Admin logged in.', 'No'),
(660, 3, 'LOGIN', 'user', '2026-10-04 17:57:39', 'Admin logged in.', 'No'),
(661, 5, 'LOGIN', 'user', '2026-10-04 18:12:59', 'Admin logged in.', 'No'),
(662, 1, 'LOGIN', 'user', '2026-10-05 17:42:11', 'Admin logged in.', 'No'),
(663, 3, 'LOGIN', 'user', '2026-10-05 17:49:04', 'Admin logged in.', 'No'),
(664, 5, 'LOGIN', 'user', '2026-10-05 18:06:06', 'Admin logged in.', 'No'),
(665, 3, 'LOGIN', 'user', '2026-10-05 18:44:46', 'Admin logged in.', 'No'),
(666, 3, 'LOGIN', 'user', '2026-10-05 18:45:12', 'Admin logged in.', 'No'),
(667, 3, 'LOGIN', 'user', '2026-10-05 18:52:01', 'Admin logged in.', 'No'),
(668, 3, 'LOGIN', 'user', '2026-10-05 18:53:06', 'Admin logged in.', 'No'),
(669, 1, 'LOGIN', 'user', '2026-10-05 19:34:42', 'Admin logged in.', 'No'),
(670, 1, 'LOGIN', 'user', '2026-10-05 21:08:18', 'Admin logged in.', 'No'),
(671, 1, 'LOGIN', 'user', '2026-10-05 21:08:44', 'Admin logged in.', 'No'),
(672, 1, 'LOGIN', 'user', '2026-10-06 10:30:49', 'Admin logged in.', 'No'),
(673, 1, 'LOGIN', 'user', '2026-10-06 13:22:44', 'Admin logged in.', 'No'),
(674, 1, 'LOGIN', 'user', '2026-10-06 13:37:18', 'Admin logged in.', 'No'),
(675, 1, 'LOGIN', 'user', '2026-10-06 13:47:44', 'Admin logged in.', 'No'),
(676, 3, 'LOGIN', 'user', '2026-10-06 14:01:31', 'Admin logged in.', 'No'),
(677, 1, 'LOGIN', 'user', '2026-10-06 23:54:39', 'Admin logged in.', 'No'),
(678, 3, 'LOGIN', 'user', '2026-10-07 00:15:39', 'Admin logged in.', 'No'),
(679, 3, 'APPROVED', 'purchase_order', '2026-10-07 00:54:16', 'Approved record #6', 'No'),
(680, 3, 'LOGIN', 'user', '2026-10-07 01:10:59', 'Admin logged in.', 'No'),
(681, 1, 'LOGIN', 'user', '2026-10-07 01:11:36', 'Admin logged in.', 'No'),
(682, 3, 'LOGIN', 'user', '2026-10-07 01:16:52', 'Admin logged in.', 'No'),
(683, 3, 'APPROVED', 'purchase_order', '2026-10-07 01:29:21', 'Approved record #4', 'No'),
(684, 3, 'REJECTED', 'purchase_order', '2026-10-07 01:29:31', 'Rejected record #3', 'No'),
(685, 3, 'LOGIN', 'user', '2026-10-07 01:30:03', 'Admin logged in.', 'No'),
(686, 3, 'LOGIN', 'user', '2026-10-07 20:50:24', 'Admin logged in.', 'No'),
(687, 1, 'LOGIN', 'user', '2026-10-07 20:51:36', 'Admin logged in.', 'No'),
(688, 3, 'LOGIN', 'user', '2026-10-07 21:17:07', 'Admin logged in.', 'No'),
(689, 3, 'LOGIN', 'user', '2026-10-07 21:28:45', 'Admin logged in.', 'No'),
(690, 1, 'LOGIN', 'user', '2026-10-07 21:41:22', 'Admin logged in.', 'No'),
(691, 3, 'APPROVED', 'stock_release', '2026-10-07 21:42:03', 'Approved record #3', 'No'),
(692, 3, 'APPROVED', 'stock_release', '2026-10-07 21:53:09', 'Approved record #2', 'No'),
(693, 5, 'LOGIN', 'user', '2026-10-07 21:54:32', 'Admin logged in.', 'No'),
(694, 5, 'LOGIN', 'user', '2026-10-07 23:07:45', 'Admin logged in.', 'No'),
(695, 1, 'LOGIN', 'user', '2026-10-07 23:14:26', 'Admin logged in.', 'No'),
(696, 1, 'LOGIN', 'user', '2026-10-07 23:14:54', 'Admin logged in.', 'No'),
(697, 1, 'LOGIN', 'user', '2026-10-07 23:15:16', 'Admin logged in.', 'No'),
(698, 1, 'INSERT', 'supplier_product', '2026-10-07 23:29:12', 'Linked 1 product(s) to Supplier: CleanHome Supplies Corp', 'No'),
(699, 2, 'LOGIN', 'user', '2026-10-07 23:52:27', 'Admin logged in.', 'No'),
(700, 3, 'LOGIN', 'user', '2026-10-07 23:56:07', 'Admin logged in.', 'No'),
(701, 2, 'UPDATE', 'receiving', '2026-10-08 00:06:28', 'Updated Receiving #16', 'No'),
(702, 2, 'LOGIN', 'user', '2026-10-08 00:34:39', 'Admin logged in.', 'No'),
(703, 2, 'INSERT', 'receiving', '2026-10-08 00:35:09', 'Created Receiving #17 (Completed)', 'No'),
(704, 1, 'LOGIN', 'user', '2026-10-08 00:49:56', 'Admin logged in.', 'No'),
(705, 3, 'LOGIN', 'user', '2026-10-08 00:50:15', 'Admin logged in.', 'No'),
(706, 2, 'LOGIN', 'user', '2026-10-08 00:50:45', 'Admin logged in.', 'No'),
(707, 5, 'LOGIN', 'user', '2026-10-08 00:50:58', 'Admin logged in.', 'No'),
(708, 1, 'INSERT', 'supplier', '2026-10-08 00:51:47', 'Added Supplier: Waz', 'No'),
(709, 1, 'INSERT', 'product', '2026-10-08 01:01:52', 'Added Product: Caress Adult pampers 2pcs (Cost: ₱15.00)', 'No'),
(710, 1, 'INSERT', 'supplier_product', '2026-10-08 01:02:22', 'Linked 1 product(s) to Supplier: Waz', 'No'),
(711, 1, 'ARCHIVE', 'supplier_product', '2026-10-08 01:02:27', 'Removed supplier-product link #27', 'No'),
(712, 1, 'INSERT', 'supplier_product', '2026-10-08 01:02:36', 'Linked 1 product(s) to Supplier: Waz', 'No'),
(713, 5, 'LOGIN', 'user', '2026-10-09 10:45:59', 'Admin logged in.', 'No'),
(714, 1, 'LOGIN', 'user', '2026-10-09 10:51:23', 'Admin logged in.', 'No'),
(715, 5, 'LOGIN', 'user', '2026-10-09 11:05:13', 'Admin logged in.', 'No'),
(716, 5, 'INSERT', 'purchase_order', '2026-10-09 11:08:12', 'Created PO #12 with 1 item(s).', 'No'),
(717, 1, 'LOGIN', 'user', '2026-10-09 11:08:26', 'Admin logged in.', 'No'),
(718, 3, 'LOGIN', 'user', '2026-10-09 11:08:52', 'Admin logged in.', 'No'),
(719, 3, 'LOGIN', 'user', '2026-10-09 11:17:15', 'Admin logged in.', 'No'),
(720, 3, 'APPROVED', 'purchase_order', '2026-10-09 11:23:53', 'Approved record #12', 'No'),
(721, 2, 'LOGIN', 'user', '2026-10-09 11:25:09', 'Admin logged in.', 'No'),
(722, 2, 'INSERT', 'receiving', '2026-10-09 11:26:23', 'Created Receiving #18 (Completed)', 'No'),
(723, 5, 'INSERT', 'purchase_return', '2026-10-09 11:28:10', 'Created purchase return #5 for PO #12.', 'No'),
(724, 3, 'APPROVED', 'purchase_return', '2026-10-09 11:43:45', 'Approved record #5', 'No'),
(725, 7, 'LOGIN', 'user', '2026-10-09 11:45:00', 'Admin logged in.', 'No'),
(726, 7, 'INSERT', 'stock_release', '2026-10-09 12:11:14', 'Created stock release #9 (Pending manager approval).', 'No'),
(727, 3, 'APPROVED', 'stock_release', '2026-10-09 12:11:55', 'Approved record #9', 'No'),
(728, 7, 'LOGIN', 'user', '2026-10-09 12:22:18', 'Admin logged in.', 'No'),
(729, 7, 'LOGIN', 'user', '2026-10-09 12:23:37', 'Admin logged in.', 'No'),
(730, 7, 'LOGIN', 'user', '2026-10-09 12:23:52', 'Admin logged in.', 'No'),
(731, 7, 'LOGIN', 'user', '2026-10-09 12:26:09', 'Admin logged in.', 'No'),
(732, 7, 'LOGIN', 'user', '2026-10-09 12:26:41', 'Admin logged in.', 'No'),
(733, 4, 'LOGIN', 'user', '2026-10-09 12:29:08', 'Admin logged in.', 'No'),
(734, 1, 'LOGIN', 'user', '2026-10-09 12:31:36', 'Admin logged in.', 'No'),
(735, 4, 'LOGIN', 'user', '2026-10-09 14:19:02', 'Admin logged in.', 'No'),
(736, 4, 'INSERT', 'inventory_adjustment', '2026-10-09 14:21:15', 'Created adjustment #15 for ProductID: 16', 'No'),
(737, 5, 'LOGIN', 'user', '2026-10-09 14:23:41', 'Admin logged in.', 'No'),
(738, 3, 'APPROVED', 'inventory_adjustment', '2026-10-09 14:24:11', 'Approved record #15', 'No'),
(739, 2, 'LOGIN', 'user', '2026-10-09 14:26:12', 'Admin logged in.', 'No'),
(740, 1, 'INSERT', 'product', '2026-10-09 14:27:53', 'Added Product: Baygon Katol (Cost: ₱12.00)', 'No'),
(741, 1, 'INSERT', 'supplier_product', '2026-10-09 14:28:31', 'Linked 1 product(s) to Supplier: Waz', 'No'),
(742, 5, 'INSERT', 'purchase_order', '2026-10-09 14:29:22', 'Created PO #13 with 1 item(s).', 'No'),
(743, 3, 'REJECTED', 'purchase_order', '2026-10-09 14:30:38', 'Rejected record #13', 'No'),
(744, 5, 'INSERT', 'purchase_order', '2026-10-09 14:31:16', 'Created PO #14 with 1 item(s).', 'No'),
(745, 3, 'APPROVED', 'purchase_order', '2026-10-09 14:31:37', 'Approved record #14', 'No'),
(746, 2, 'INSERT', 'receiving', '2026-10-09 14:32:10', 'Created Receiving #19 (Completed)', 'No'),
(747, 7, 'INSERT', 'stock_release', '2026-10-09 15:32:49', 'Created stock release #10 (Pending manager approval).', 'No'),
(748, 3, 'REJECTED', 'stock_release', '2026-10-09 15:36:47', 'Rejected record #10', 'No'),
(749, 7, 'INSERT', 'stock_release', '2026-10-09 15:39:07', 'Created stock release #11 (Pending manager approval).', 'No'),
(750, 3, 'APPROVED', 'stock_release', '2026-10-09 15:39:20', 'Approved record #11', 'No'),
(751, 1, 'LOGIN', 'user', '2026-10-11 16:01:18', 'Admin logged in.', 'No'),
(752, 1, 'LOGIN', 'user', '2026-10-11 16:22:56', 'Admin logged in.', 'No'),
(753, 3, 'LOGIN', 'user', '2026-10-11 16:32:10', 'Admin logged in.', 'No'),
(754, 3, 'LOGIN', 'user', '2026-10-11 16:40:29', 'Admin logged in.', 'No'),
(755, 1, 'LOGIN', 'user', '2026-10-11 17:19:03', 'Admin logged in.', 'No'),
(756, 3, 'LOGIN', 'user', '2026-10-11 17:58:58', 'Admin logged in.', 'No'),
(757, 1, 'ARCHIVE', 'bin', '2026-10-11 18:12:08', 'Archived Bin: AISLE-D / D-SHELF-01 / D1-BIN-01', 'No'),
(758, 1, 'UNARCHIVE', 'bin', '2026-10-11 18:12:13', 'Restored Bin: AISLE-D / D-SHELF-01 / D1-BIN-01', 'No'),
(759, 5, 'LOGIN', 'user', '2026-10-11 18:13:14', 'Admin logged in.', 'No'),
(760, 2, 'LOGIN', 'user', '2026-10-11 18:14:56', 'Admin logged in.', 'No'),
(761, 2, 'LOGIN', 'user', '2026-10-11 18:24:33', 'Admin logged in.', 'No'),
(762, 4, 'LOGIN', 'user', '2026-10-11 18:34:35', 'Admin logged in.', 'No'),
(763, 4, 'LOGIN', 'user', '2026-10-11 18:43:33', 'Admin logged in.', 'No'),
(764, 4, 'LOGIN', 'user', '2026-10-11 18:48:40', 'Admin logged in.', 'No'),
(765, 1, 'LOGIN', 'user', '2026-10-11 18:51:47', 'Admin logged in.', 'No'),
(766, 3, 'LOGIN', 'user', '2026-10-11 18:52:03', 'Admin logged in.', 'No'),
(767, 4, 'LOGIN', 'user', '2026-10-11 18:52:27', 'Admin logged in.', 'No'),
(768, 4, 'LOGIN', 'user', '2026-10-11 18:53:29', 'Admin logged in.', 'No'),
(769, 4, 'ARCHIVE', 'inventory_adjustment', '2026-10-11 18:53:50', 'Cancelled adjustment #13', 'No'),
(770, 4, 'ARCHIVE', 'inventory_adjustment', '2026-10-11 19:02:24', 'Cancelled adjustment #12', 'No'),
(771, 5, 'LOGIN', 'user', '2026-10-11 19:04:00', 'Admin logged in.', 'No'),
(772, 2, 'LOGIN', 'user', '2026-10-11 19:04:14', 'Admin logged in.', 'No'),
(773, 7, 'LOGIN', 'user', '2026-10-11 19:04:30', 'Admin logged in.', 'No'),
(774, 1, 'LOGIN', 'user', '2026-10-11 19:06:42', 'Admin logged in.', 'No'),
(775, 1, 'LOGOUT', 'user', '2026-10-11 19:07:42', 'Admin logged out.', 'No'),
(776, 1, 'LOGIN', 'user', '2026-10-11 19:09:31', 'Admin logged in.', 'No'),
(777, 1, 'ARCHIVE', 'category', '2026-10-11 19:10:04', 'Archived Category: Snacks', 'No'),
(778, 1, 'UNARCHIVE', 'category', '2026-10-11 19:10:09', 'Restored Category: Snacks', 'No'),
(779, 1, 'INSERT', 'category', '2026-10-11 19:10:24', 'Added Category: Frozen Foods', 'No'),
(780, 1, 'INSERT', 'supplier', '2026-10-11 19:11:23', 'Added Supplier: Virginia Inc.', 'No'),
(781, 1, 'INSERT', 'aisle', '2026-10-11 19:11:44', 'Added Aisle: AISLE-E', 'No'),
(782, 1, 'INSERT', 'shelf', '2026-10-11 19:12:10', 'Added Shelf: AISLE-E / SHELF-09', 'No'),
(783, 1, 'INSERT', 'bin', '2026-10-11 19:12:26', 'Added Bin: AISLE-E / SHELF-09 / BIN-03', 'No'),
(784, 1, 'INSERT', 'product', '2026-10-11 19:13:17', 'Added Product: Virginia Hotdog 1kg (Cost: ₱100.00)', 'No'),
(785, 1, 'LOGIN', 'user', '2026-10-11 19:15:46', 'Admin logged in.', 'No'),
(786, 1, 'INSERT', 'category', '2026-10-11 19:16:11', 'Added Category: Bread', 'No'),
(787, 1, 'LOGIN', 'user', '2026-10-11 19:17:37', 'Admin logged in.', 'No'),
(788, 1, 'INSERT', 'supplier', '2026-10-11 19:18:39', 'Added Supplier: Arbees Bakeshop', 'No'),
(789, 1, 'INSERT', 'product', '2026-10-11 19:19:19', 'Added Product: Monay (Cost: ₱2.00)', 'No'),
(790, 1, 'LOGIN', 'user', '2026-10-11 19:21:08', 'Admin logged in.', 'No'),
(791, 1, 'INSERT', 'category', '2026-10-11 19:21:34', 'Added Category: Fruits', 'No'),
(792, 1, 'ARCHIVE', 'category', '2026-10-11 19:21:39', 'Archived Category: Fruits', 'No'),
(793, 1, 'UNARCHIVE', 'category', '2026-10-11 19:21:43', 'Restored Category: Fruits', 'No'),
(794, 1, 'INSERT', 'supplier', '2026-10-11 19:22:38', 'Added Supplier: Fruits Corp.', 'No'),
(795, 1, 'INSERT', 'aisle', '2026-10-11 19:23:05', 'Added Aisle: AISLE-F', 'No'),
(796, 1, 'INSERT', 'shelf', '2026-10-11 19:23:20', 'Added Shelf: AISLE-F / SHELF-100', 'No'),
(797, 1, 'INSERT', 'bin', '2026-10-11 19:23:33', 'Added Bin: AISLE-F / SHELF-100 / BIN-20', 'No'),
(798, 1, 'INSERT', 'product', '2026-10-11 19:24:22', 'Added Product: GRAPES (Cost: ₱50.00)', 'No'),
(799, 1, 'INSERT', 'supplier_product', '2026-10-11 19:24:39', 'Linked 1 product(s) to Supplier: Fruits Corp.', 'No'),
(800, 5, 'LOGIN', 'user', '2026-10-11 19:25:47', 'Admin logged in.', 'No'),
(801, 5, 'INSERT', 'purchase_order', '2026-10-11 19:26:32', 'Created PO #15 with 1 item(s).', 'No'),
(802, 5, 'UPDATE', 'purchase_order', '2026-10-11 19:26:41', 'Updated PO #15.', 'No'),
(803, 3, 'LOGIN', 'user', '2026-10-11 19:27:15', 'Admin logged in.', 'No'),
(804, 3, 'APPROVED', 'purchase_order', '2026-10-11 19:27:37', 'Approved record #15', 'No'),
(805, 2, 'LOGIN', 'user', '2026-10-11 19:28:37', 'Admin logged in.', 'No'),
(806, 2, 'INSERT', 'receiving', '2026-10-11 19:29:00', 'Created Receiving #20 (Completed)', 'No'),
(807, 4, 'LOGIN', 'user', '2026-10-11 19:30:26', 'Admin logged in.', 'No'),
(808, 4, 'INSERT', 'inventory_adjustment', '2026-10-11 19:31:03', 'Created adjustment #16 for ProductID: 20', 'No'),
(809, 3, 'APPROVED', 'inventory_adjustment', '2026-10-11 19:31:19', 'Approved record #16', 'No'),
(810, 4, 'INSERT', 'stock_return', '2026-10-11 19:31:47', 'Created stock return #4 for ProductID: 20', 'No'),
(811, 3, 'APPROVED', 'stock_return', '2026-10-11 19:32:03', 'Approved record #4', 'No'),
(812, 7, 'LOGIN', 'user', '2026-10-11 19:33:03', 'Admin logged in.', 'No'),
(813, 7, 'INSERT', 'stock_release', '2026-10-11 19:33:39', 'Created stock release #12 (Pending manager approval).', 'No'),
(814, 3, 'APPROVED', 'stock_release', '2026-10-11 19:33:50', 'Approved record #12', 'No'),
(815, 1, 'LOGIN', 'user', '2026-10-11 22:00:12', 'Admin logged in.', 'No'),
(816, 1, 'LOGIN', 'user', '2026-10-11 22:00:29', 'Admin logged in.', 'No'),
(817, 1, 'LOGIN', 'user', '2026-10-11 22:13:37', 'Admin logged in.', 'No'),
(818, 1, 'UPDATE', 'user', '2026-10-11 22:23:25', 'Changed User: Admin status to Inactive', 'No'),
(819, 1, 'UPDATE', 'user', '2026-10-11 22:25:53', 'Changed User: angel status to Inactive', 'No'),
(820, 1, 'UPDATE', 'user', '2026-10-11 22:25:58', 'Changed User: angel status to Active', 'No'),
(821, 1, 'UPDATE', 'user', '2026-10-11 22:26:19', 'Updated User: angel', 'No'),
(822, 3, 'LOGIN', 'user', '2026-10-11 22:38:34', 'Admin logged in.', 'No'),
(823, 2, 'LOGIN', 'user', '2026-10-11 22:41:59', 'Admin logged in.', 'No'),
(824, 5, 'LOGIN', 'user', '2026-10-11 22:45:32', 'Admin logged in.', 'No'),
(825, 2, 'LOGIN', 'user', '2026-10-11 23:05:51', 'Admin logged in.', 'No'),
(826, 4, 'LOGIN', 'user', '2026-10-12 22:20:53', 'Admin logged in.', 'No'),
(827, 7, 'LOGIN', 'user', '2026-10-12 22:22:44', 'Admin logged in.', 'No'),
(828, 7, 'UPDATE', 'stock_release', '2026-10-12 22:23:04', 'Completed stock release #3.', 'No'),
(829, 7, 'UPDATE', 'stock_release', '2026-10-12 22:23:08', 'Completed stock release #2.', 'No'),
(830, 1, 'LOGIN', 'user', '2026-10-12 22:23:47', 'Admin logged in.', 'No'),
(831, 3, 'LOGIN', 'user', '2026-10-12 22:32:06', 'Admin logged in.', 'No'),
(832, 7, 'LOGIN', 'user', '2026-10-12 22:50:02', 'Admin logged in.', 'No'),
(833, 7, 'LOGIN', 'user', '2026-10-12 22:57:11', 'Admin logged in.', 'No'),
(834, 4, 'LOGIN', 'user', '2026-10-12 23:19:51', 'Admin logged in.', 'No'),
(835, 2, 'LOGIN', 'user', '2026-10-12 23:20:39', 'Admin logged in.', 'No'),
(836, 5, 'LOGIN', 'user', '2026-10-12 23:21:48', 'Admin logged in.', 'No'),
(837, 5, 'LOGIN', 'user', '2026-10-12 23:35:23', 'Admin logged in.', 'No'),
(838, 1, 'LOGIN', 'user', '2026-10-15 21:43:49', 'Admin logged in.', 'No'),
(839, 1, 'LOGOUT', 'user', '2026-10-15 21:43:57', 'Admin logged out.', 'No'),
(840, 1, 'LOGIN', 'user', '2026-10-16 19:40:34', 'Admin logged in.', 'No'),
(841, 1, 'LOGOUT', 'user', '2026-10-16 19:40:51', 'Admin logged out.', 'No'),
(842, 3, 'LOGIN', 'user', '2026-10-16 19:40:55', 'Admin logged in.', 'No'),
(843, 3, 'LOGOUT', 'user', '2026-10-16 19:41:04', 'Manager logged out.', 'No'),
(844, 4, 'LOGIN', 'user', '2026-10-16 19:41:21', 'Admin logged in.', 'No'),
(845, 1, 'LOGIN', 'user', '2026-10-16 20:11:05', 'Admin logged in.', 'No'),
(846, 1, 'LOGIN', 'user', '2026-10-16 20:41:09', 'Admin logged in.', 'No'),
(847, 5, 'LOGIN', 'user', '2026-10-19 14:59:37', 'Admin logged in.', 'No'),
(848, 5, 'LOGOUT', 'user', '2026-10-19 15:02:25', 'User logged out.', 'No'),
(849, 1, 'LOGIN', 'user', '2026-10-19 15:02:32', 'Admin logged in.', 'No'),
(850, 1, 'LOGOUT', 'user', '2026-10-19 15:02:50', 'Admin logged out.', 'No'),
(851, 4, 'LOGIN', 'user', '2026-10-19 15:02:58', 'Admin logged in.', 'No'),
(852, 4, 'LOGOUT', 'user', '2026-10-19 15:14:17', 'Inventory Staff logged out.', 'No'),
(853, 7, 'LOGIN', 'user', '2026-10-19 15:14:23', 'Admin logged in.', 'No'),
(854, 7, 'INSERT', 'stock_release', '2026-10-19 15:14:40', 'Created stock release #13 (Pending manager approval).', 'No'),
(855, 7, 'INSERT', 'stock_release', '2026-10-19 15:20:05', 'Created stock release #14 (Approved, ready to process).', 'No'),
(856, 7, 'UPDATE', 'stock_release', '2026-10-19 15:20:34', 'Completed stock release #14.', 'No'),
(857, 7, 'INSERT', 'stock_release', '2026-10-19 15:23:05', 'Created stock release #15 (Completed).', 'No'),
(858, 5, 'LOGIN', 'user', '2026-10-19 15:25:02', 'Admin logged in.', 'No'),
(859, 7, 'INSERT', 'stock_release', '2026-10-19 15:25:53', 'Created stock release #16 (Completed).', 'No'),
(860, 7, 'INSERT', 'stock_release', '2026-10-19 15:26:24', 'Created stock release #17 (Completed).', 'No'),
(861, 7, 'INSERT', 'stock_release', '2026-10-19 15:26:47', 'Created stock release #18 (Completed).', 'No'),
(862, 1, 'LOGIN', 'user', '2026-10-19 15:28:10', 'Admin logged in.', 'No'),
(863, 4, 'LOGIN', 'user', '2026-10-19 15:28:19', 'Admin logged in.', 'No'),
(864, 2, 'LOGIN', 'user', '2026-10-19 15:42:32', 'Admin logged in.', 'No'),
(865, 3, 'LOGIN', 'user', '2026-10-19 15:42:59', 'Admin logged in.', 'No');

-- --------------------------------------------------------

--
-- Table structure for table `bin`
--

CREATE TABLE `bin` (
  `BinID` int(11) NOT NULL,
  `ShelfID` int(11) NOT NULL,
  `BinCode` varchar(50) NOT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bin`
--

INSERT INTO `bin` (`BinID`, `ShelfID`, `BinCode`, `IsArchived`) VALUES
(1, 1, 'A1-BIN-01', 'No'),
(2, 1, 'A1-BIN-02', 'No'),
(3, 2, 'A2-BIN-01', 'No'),
(4, 3, 'B1-BIN-01', 'No'),
(5, 4, 'B2-BIN-01', 'No'),
(6, 5, 'C1-BIN-01', 'No'),
(7, 6, 'D1-BIN-01', 'No'),
(8, 7, 'bin90', 'No'),
(9, 8, 'BIN-03', 'No'),
(10, 9, 'BIN-20', 'No');

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `CategoryID` int(11) NOT NULL,
  `CategoryName` varchar(100) NOT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`CategoryID`, `CategoryName`, `IsArchived`) VALUES
(1, 'Beverage', 'No'),
(2, 'Snacks', 'No'),
(3, 'Canned Goods', 'No'),
(4, 'Dairy Products', 'No'),
(5, 'Household Supplies', 'No'),
(6, 'Personal Care', 'No'),
(7, 'Grains & Staples', 'No'),
(8, 'Condimen', 'No'),
(9, 'Condiments', 'No'),
(10, 'dry goods', 'No'),
(11, 'Frozen Foods', 'No'),
(12, 'Bread', 'No'),
(13, 'Fruits', 'No');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_adjustment`
--

CREATE TABLE `inventory_adjustment` (
  `Adjustment_ID` int(11) NOT NULL,
  `User_ID` int(11) NOT NULL,
  `Adjustment_Date` date NOT NULL,
  `Reason` varchar(255) DEFAULT NULL,
  `Status_ID` int(11) NOT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_adjustment`
--

INSERT INTO `inventory_adjustment` (`Adjustment_ID`, `User_ID`, `Adjustment_Date`, `Reason`, `Status_ID`, `IsArchived`) VALUES
(1, 2, '2026-08-31', 'Monthly physical count adjustment', 3, 'No'),
(2, 2, '2026-09-13', 'Nakit-an nga damaged items sa bodega', 2, 'No'),
(3, 4, '2026-09-22', 'expired', 4, 'No'),
(4, 4, '2026-09-23', 'secret', 2, 'No'),
(5, 4, '2026-10-02', 'expired', 2, 'No'),
(6, 4, '2026-10-02', 'Expired', 2, 'No'),
(7, 4, '2026-10-02', 'expired', 2, 'No'),
(8, 4, '2026-10-02', 'secret', 2, 'No'),
(9, 4, '2026-10-02', 'expired', 2, 'No'),
(10, 4, '2026-10-02', 'expired', 2, 'No'),
(11, 4, '2026-10-02', 'secret', 1, 'No'),
(12, 4, '2026-10-02', 'expired', 1, 'Yes'),
(13, 4, '2026-10-03', 'expired', 1, 'Yes'),
(14, 4, '2026-10-03', 'new', 2, 'No'),
(15, 4, '2026-10-09', 'expired', 2, 'No'),
(16, 4, '2026-10-11', 'rooten', 2, 'No');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_adjustment_line`
--

CREATE TABLE `inventory_adjustment_line` (
  `Adjustment_Line_ID` int(11) NOT NULL,
  `Adjustment_ID` int(11) NOT NULL,
  `Product_ID` int(11) NOT NULL,
  `System_Quantity` int(11) NOT NULL,
  `Actual_Quantity` int(11) NOT NULL,
  `Adjustment_Quantity` int(11) NOT NULL,
  `Adjustment_Type` varchar(50) DEFAULT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_adjustment_line`
--

INSERT INTO `inventory_adjustment_line` (`Adjustment_Line_ID`, `Adjustment_ID`, `Product_ID`, `System_Quantity`, `Actual_Quantity`, `Adjustment_Quantity`, `Adjustment_Type`, `IsArchived`) VALUES
(1, 1, 1, 140, 138, -2, 'Shrinkage', 'No'),
(2, 1, 9, 400, 402, 2, 'Found Stock', 'No'),
(3, 2, 4, 215, 210, -5, 'Damaged', 'No'),
(5, 3, 4, 471, 469, 2, 'Decrease', 'No'),
(8, 4, 4, 469, 70, 399, 'Decrease', 'No'),
(9, 5, 13, 95, 90, 5, 'Decrease', 'No'),
(10, 6, 14, 95, 90, 5, 'Decrease', 'No'),
(11, 7, 14, 90, 75, 15, 'Decrease', 'No'),
(12, 8, 4, 60, 55, 5, 'Decrease', 'No'),
(13, 9, 4, 55, 95, 40, 'Increase', 'No'),
(14, 10, 15, 100, 95, 5, 'Decrease', 'No'),
(15, 11, 4, 95, 90, 5, 'Decrease', 'No'),
(16, 12, 1, 130, 125, 5, 'Decrease', 'No'),
(17, 13, 4, 590, 0, 590, 'Decrease', 'No'),
(18, 14, 4, 0, 100, 100, 'Increase', 'No'),
(19, 15, 16, 5, 3, 2, 'Decrease', 'No'),
(20, 16, 20, 30, 25, 5, 'Decrease', 'No');

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `ProductID` int(11) NOT NULL,
  `Barcode` varchar(50) DEFAULT NULL,
  `ProductName` varchar(150) NOT NULL,
  `CostPrice` decimal(10,2) NOT NULL DEFAULT 0.00,
  `Description` text DEFAULT NULL,
  `UnitOfMeasureID` int(11) DEFAULT NULL,
  `MinStockLevel` int(11) NOT NULL DEFAULT 0,
  `MaxStockLevel` int(11) NOT NULL DEFAULT 0,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `BinID` int(11) DEFAULT NULL,
  `CategoryID` int(11) DEFAULT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`ProductID`, `Barcode`, `ProductName`, `CostPrice`, `Description`, `UnitOfMeasureID`, `MinStockLevel`, `MaxStockLevel`, `CreatedAt`, `BinID`, `CategoryID`, `IsArchived`) VALUES
(1, '4800000000011', 'Coca-Cola 1.5L', 85.00, 'Softdrinks, bottled 1.5 liter', 3, 50, 200, '2026-09-14 18:35:02', 1, 1, 'No'),
(2, '4800000000028', 'Piattos Cheese 85g', 65.00, 'Potato chips, cheese flavor', 5, 100, 300, '2026-09-14 18:35:02', 3, 2, 'No'),
(3, '4800000000035', 'Century Tuna Flakes in Oil 180g', 45.00, 'Canned tuna flakes', 4, 80, 250, '2026-09-14 18:35:02', 4, 3, 'No'),
(4, '4800000000042', 'Alaska Fresh Milk 1L', 50.00, 'Fresh milk, pasteurized', 3, 40, 120, '2026-09-14 18:35:02', 5, 4, 'No'),
(5, '4800000000059', 'Joy Dishwashing Liquid 495ml', 95.00, 'Household dishwashing liquid', 1, 60, 180, '2026-09-14 18:35:02', 6, 5, 'No'),
(6, '4800000000066', 'Palmolive Shampoo 340ml', 120.00, 'Hair shampoo, personal care', 1, 50, 150, '2026-09-14 18:35:02', 7, 6, 'No'),
(7, '4800000000073', 'Jasmine Rice 25kg', 850.00, 'Premium jasmine rice sack', 6, 20, 60, '2026-09-14 18:35:02', 6, 7, 'No'),
(8, '4800000000080', 'Lucky Me Pancit Canton 60g', 55.00, 'Instant noodles, pancit canton flavor', 5, 150, 400, '2026-09-14 18:35:02', 3, 2, 'No'),
(9, '4800000000097', 'Nescafe 3-in-1 Original 20g', 40.00, 'Instant coffee mix', 5, 100, 300, '2026-09-14 18:35:02', 1, 1, 'No'),
(10, '4800000000103', 'Del Monte Pineapple Juice 1L', 70.00, 'Canned pineapple juice drink', 3, 50, 150, '2026-09-14 18:35:02', 4, 1, 'No'),
(11, '1726738365', 'bombay', 25.00, 'onion', 2, 90, 250, '2026-09-17 18:58:46', 8, 10, 'No'),
(12, '90725379340', 'Sprite', 15.00, 'Soda', 3, 50, 150, '2026-09-29 11:41:50', 6, 1, 'No'),
(13, '8203467892', 'Milo 500 g', 35.00, 'chocolate Drink', 2, 100, 300, '2026-10-02 13:08:39', 7, 4, 'No'),
(14, '09347538753', 'Bear Brand', 60.00, 'Milk', 5, 100, 300, '2026-10-02 17:57:17', 8, 4, 'No'),
(15, '8967532346', 'C2 APPLE', 30.00, 'apple drink', 1, 50, 150, '2026-10-02 21:22:40', 1, 1, 'No'),
(16, '822220000292', 'Caress Adult pampers 2pcs', 15.00, 'Diaper', 1, 50, 150, '2026-10-08 01:01:52', 5, 6, 'No'),
(17, '2886239374447930', 'Baygon Katol', 12.00, 'Insects Repellant', 4, 100, 300, '2026-10-09 14:27:53', 1, 5, 'No'),
(18, '093549505534', 'Virginia Hotdog 1kg', 100.00, 'hotdog', 2, 50, 150, '2026-10-11 19:13:17', 9, 11, 'No'),
(19, '0926738940', 'Monay', 2.00, 'Bread', 5, 20, 60, '2026-10-11 19:19:19', 9, 12, 'No'),
(20, '0936790221', 'GRAPES', 50.00, 'FRUITS', 2, 17, 50, '2026-10-11 19:24:22', 10, 13, 'No');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_order`
--

CREATE TABLE `purchase_order` (
  `PO_ID` int(11) NOT NULL,
  `Supplier_ID` int(11) NOT NULL,
  `User_ID` int(11) NOT NULL,
  `PO_Date` date NOT NULL,
  `Expected_Date` date DEFAULT NULL,
  `Status_ID` int(11) NOT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_order`
--

INSERT INTO `purchase_order` (`PO_ID`, `Supplier_ID`, `User_ID`, `PO_Date`, `Expected_Date`, `Status_ID`, `IsArchived`) VALUES
(1, 1, 5, '2026-08-01', '2026-08-06', 3, 'No'),
(2, 2, 5, '2026-08-05', '2026-08-08', 3, 'No'),
(3, 4, 5, '2026-08-10', '2026-08-12', 5, 'No'),
(4, 5, 5, '2026-09-01', '2026-09-11', 2, 'No'),
(5, 2, 5, '2026-09-29', '2026-10-03', 4, 'No'),
(6, 4, 5, '2026-10-01', '2026-10-03', 2, 'No'),
(7, 3, 1, '2026-10-01', '2026-10-08', 3, 'No'),
(8, 3, 5, '2026-10-02', '2026-10-09', 3, 'No'),
(9, 4, 5, '2026-10-02', '2026-10-05', 3, 'No'),
(10, 2, 5, '2026-10-02', '2026-10-04', 2, 'No'),
(11, 3, 5, '2026-10-03', '2026-10-11', 3, 'No'),
(12, 8, 5, '2026-10-09', '2026-10-12', 3, 'No'),
(13, 8, 5, '2026-10-09', '2026-10-12', 5, 'No'),
(14, 8, 5, '2026-10-09', '2026-10-12', 3, 'No'),
(15, 11, 5, '2026-10-11', '2026-10-14', 3, 'No');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_order_line`
--

CREATE TABLE `purchase_order_line` (
  `PO_Line_ID` int(11) NOT NULL,
  `PO_ID` int(11) NOT NULL,
  `Product_ID` int(11) NOT NULL,
  `Quantity` int(11) NOT NULL,
  `Unit_Price` decimal(10,2) NOT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_order_line`
--

INSERT INTO `purchase_order_line` (`PO_Line_ID`, `PO_ID`, `Product_ID`, `Quantity`, `Unit_Price`, `IsArchived`) VALUES
(1, 1, 1, 200, 45.00, 'No'),
(2, 1, 9, 300, 8.50, 'No'),
(3, 1, 10, 150, 55.00, 'No'),
(4, 2, 2, 500, 15.00, 'No'),
(5, 2, 8, 800, 12.00, 'No'),
(6, 3, 4, 250, 75.00, 'No'),
(7, 4, 7, 100, 1450.00, 'No'),
(8, 5, 3, 90, 8.00, 'No'),
(9, 6, 4, 1, 75.00, 'No'),
(10, 7, 6, 90, 8.00, 'No'),
(11, 8, 13, 100, 5.00, 'No'),
(12, 9, 14, 100, 20.00, 'No'),
(13, 10, 15, 90, 15.00, 'No'),
(14, 11, 4, 100, 9.00, 'No'),
(15, 11, 14, 55, 5.00, 'No'),
(16, 11, 11, 100, 2.00, 'No'),
(17, 12, 16, 70, 15.00, 'No'),
(18, 13, 17, 100, 12.00, 'No'),
(19, 14, 17, 100, 12.00, 'No'),
(21, 15, 20, 40, 50.00, 'No');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_return`
--

CREATE TABLE `purchase_return` (
  `Purchase_Return_ID` int(11) NOT NULL,
  `PO_ID` int(11) NOT NULL,
  `Supplier_ID` int(11) NOT NULL,
  `User_ID` int(11) NOT NULL,
  `Return_Date` date NOT NULL,
  `Status_ID` int(11) NOT NULL,
  `Reason` varchar(255) DEFAULT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_return`
--

INSERT INTO `purchase_return` (`Purchase_Return_ID`, `PO_ID`, `Supplier_ID`, `User_ID`, `Return_Date`, `Status_ID`, `Reason`, `IsArchived`) VALUES
(1, 1, 1, 5, '2026-08-07', 3, 'Naay 10 bottles nga leaking / damaged sa delivery', 'No'),
(2, 2, 2, 5, '2026-08-09', 2, 'Sayop nga variant ang na-deliver', 'No'),
(3, 3, 4, 5, '2026-09-16', 3, 'Damage goods', 'No'),
(4, 4, 5, 5, '2026-10-01', 1, 'damaged', 'No'),
(5, 12, 8, 5, '2026-10-09', 2, 'damaged', 'No');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_return_line`
--

CREATE TABLE `purchase_return_line` (
  `Purchase_Return_Line_ID` int(11) NOT NULL,
  `Purchase_Return_ID` int(11) NOT NULL,
  `Product_ID` int(11) NOT NULL,
  `Quantity` int(11) NOT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_return_line`
--

INSERT INTO `purchase_return_line` (`Purchase_Return_Line_ID`, `Purchase_Return_ID`, `Product_ID`, `Quantity`, `IsArchived`) VALUES
(1, 1, 1, 10, 'No'),
(2, 2, 2, 25, 'No'),
(4, 3, 4, 1, 'No'),
(5, 4, 7, 3, 'No'),
(6, 5, 16, 5, 'No');

-- --------------------------------------------------------

--
-- Table structure for table `receiving`
--

CREATE TABLE `receiving` (
  `ReceivingID` int(11) NOT NULL,
  `SupplierID` int(11) NOT NULL,
  `ReceivedByUserID` int(11) NOT NULL,
  `ReceivingDate` date NOT NULL,
  `StatusID` int(11) NOT NULL,
  `PO_ID` int(11) DEFAULT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `receiving`
--

INSERT INTO `receiving` (`ReceivingID`, `SupplierID`, `ReceivedByUserID`, `ReceivingDate`, `StatusID`, `PO_ID`, `IsArchived`) VALUES
(1, 1, 3, '2026-08-06', 3, 1, 'No'),
(2, 2, 4, '2026-08-08', 3, 2, 'No'),
(3, 4, 3, '2026-08-12', 1, 3, 'No'),
(7, 4, 2, '2026-09-17', 1, 3, 'No'),
(8, 2, 2, '2026-09-30', 1, 5, 'No'),
(9, 3, 2, '2026-10-02', 3, 8, 'No'),
(10, 4, 2, '2026-10-02', 1, 9, 'No'),
(11, 2, 2, '2026-10-02', 3, 10, 'No'),
(12, 4, 2, '2026-10-02', 3, 3, 'No'),
(13, 4, 2, '2026-10-02', 3, 3, 'No'),
(14, 3, 2, '2026-10-02', 3, 8, 'No'),
(15, 3, 2, '2026-10-02', 3, 7, 'No'),
(16, 3, 2, '2026-10-03', 3, 11, 'No'),
(17, 4, 2, '2026-10-07', 3, 9, 'No'),
(18, 8, 2, '2026-10-09', 3, 12, 'No'),
(19, 8, 2, '2026-10-09', 3, 14, 'No'),
(20, 11, 2, '2026-10-11', 3, 15, 'No');

-- --------------------------------------------------------

--
-- Table structure for table `receiving_line`
--

CREATE TABLE `receiving_line` (
  `ReceivingLineID` int(11) NOT NULL,
  `ReceivingID` int(11) NOT NULL,
  `ProductID` int(11) NOT NULL,
  `ReceivedQuantity` int(11) NOT NULL,
  `CostPrice` decimal(10,2) NOT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `receiving_line`
--

INSERT INTO `receiving_line` (`ReceivingLineID`, `ReceivingID`, `ProductID`, `ReceivedQuantity`, `CostPrice`, `IsArchived`) VALUES
(1, 1, 1, 190, 45.00, 'No'),
(2, 1, 9, 300, 8.50, 'No'),
(3, 1, 10, 150, 55.00, 'No'),
(4, 2, 2, 475, 15.00, 'No'),
(5, 2, 8, 800, 12.00, 'No'),
(6, 3, 4, 250, 75.00, 'No'),
(7, 7, 4, 245, 75.00, 'No'),
(9, 8, 3, 85, 8.00, 'No'),
(10, 9, 13, 95, 5.00, 'No'),
(11, 10, 14, 95, 20.00, 'No'),
(12, 11, 15, 100, 15.00, 'No'),
(13, 12, 4, 250, 75.00, 'No'),
(14, 13, 4, 250, 75.00, 'No'),
(15, 14, 13, 100, 5.00, 'No'),
(16, 15, 6, 90, 8.00, 'No'),
(20, 16, 4, 100, 9.00, 'No'),
(21, 16, 14, 50, 5.00, 'No'),
(22, 16, 11, 100, 2.00, 'No'),
(23, 17, 14, 100, 20.00, 'No'),
(24, 18, 16, 60, 15.00, 'No'),
(25, 19, 17, 100, 12.00, 'No'),
(26, 20, 20, 30, 50.00, 'No');

-- --------------------------------------------------------

--
-- Table structure for table `role`
--

CREATE TABLE `role` (
  `RoleID` int(11) NOT NULL,
  `RoleName` varchar(100) NOT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role`
--

INSERT INTO `role` (`RoleID`, `RoleName`, `IsArchived`) VALUES
(1, 'Administrator', 'No'),
(2, 'Warehouse Manager', 'No'),
(3, 'Inventory staff', 'No'),
(4, 'Purchasing Officer', 'No'),
(5, 'Receiving Staff', 'No'),
(7, 'inventory clerk', 'No'),
(8, 'Releasing Staff', 'No');

-- --------------------------------------------------------

--
-- Table structure for table `shelf`
--

CREATE TABLE `shelf` (
  `ShelfID` int(11) NOT NULL,
  `AisleID` int(11) NOT NULL,
  `ShelfCode` varchar(50) NOT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shelf`
--

INSERT INTO `shelf` (`ShelfID`, `AisleID`, `ShelfCode`, `IsArchived`) VALUES
(1, 1, 'A-SHELF-01', 'No'),
(2, 1, 'A-SHELF-02', 'No'),
(3, 2, 'B-SHELF-01', 'No'),
(4, 2, 'B-SHELF-02', 'No'),
(5, 3, 'C-SHELF-01', 'No'),
(6, 4, 'D-SHELF-01', 'No'),
(7, 5, 'shelf-90', 'No'),
(8, 6, 'SHELF-09', 'No'),
(9, 7, 'SHELF-100', 'No');

-- --------------------------------------------------------

--
-- Table structure for table `status`
--

CREATE TABLE `status` (
  `StatusID` int(11) NOT NULL,
  `StatusName` varchar(100) NOT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `status`
--

INSERT INTO `status` (`StatusID`, `StatusName`, `IsArchived`) VALUES
(1, 'Pending', 'No'),
(2, 'Approved', 'No'),
(3, 'Completed', 'No'),
(4, 'Cancelled', 'No'),
(5, 'Rejected', 'No');

-- --------------------------------------------------------

--
-- Table structure for table `stock_release`
--

CREATE TABLE `stock_release` (
  `ReleaseID` int(11) NOT NULL,
  `ReleasedByUserID` int(11) DEFAULT NULL,
  `ReleaseDate` date NOT NULL,
  `Status_ID` int(11) NOT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_release`
--

INSERT INTO `stock_release` (`ReleaseID`, `ReleasedByUserID`, `ReleaseDate`, `Status_ID`, `IsArchived`) VALUES
(1, 2, '2026-08-15', 3, 'No'),
(2, 7, '2026-08-20', 3, 'No'),
(3, 7, '2026-09-10', 3, 'No'),
(4, 7, '2026-10-02', 3, 'No'),
(5, 7, '2026-10-02', 3, 'No'),
(6, 7, '2026-10-02', 3, 'No'),
(7, 7, '2026-10-02', 3, 'No'),
(8, 7, '2026-10-02', 3, 'No'),
(9, 7, '2026-10-09', 3, 'No'),
(10, 7, '2026-10-09', 5, 'No'),
(11, 7, '2026-10-09', 3, 'No'),
(12, 7, '2026-10-11', 3, 'No'),
(13, 7, '2026-10-19', 1, 'No'),
(14, 7, '2026-10-19', 3, 'No'),
(15, 7, '2026-10-19', 3, 'No'),
(16, 7, '2026-10-19', 3, 'No'),
(17, 7, '2026-10-19', 3, 'No'),
(18, 7, '2026-10-19', 3, 'No');

-- --------------------------------------------------------

--
-- Table structure for table `stock_release_line`
--

CREATE TABLE `stock_release_line` (
  `ReleaseLineID` int(11) NOT NULL,
  `ReleaseID` int(11) NOT NULL,
  `QuantityReleased` int(11) NOT NULL,
  `SellingPrice` decimal(10,2) NOT NULL DEFAULT 0.00,
  `ProductID` int(11) NOT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_release_line`
--

INSERT INTO `stock_release_line` (`ReleaseLineID`, `ReleaseID`, `QuantityReleased`, `SellingPrice`, `ProductID`, `IsArchived`) VALUES
(1, 1, 50, 102.00, 1, 'No'),
(2, 1, 100, 48.00, 9, 'No'),
(3, 2, 200, 66.00, 8, 'No'),
(4, 3, 30, 48.00, 4, 'No'),
(5, 4, 10, 48.00, 9, 'No'),
(6, 5, 10, 72.00, 9, 'No'),
(7, 6, 20, 60.00, 14, 'No'),
(8, 7, 10, 36.00, 4, 'No'),
(9, 8, 30, 36.00, 15, 'No'),
(10, 9, 50, 0.00, 16, 'No'),
(11, 10, 10, 14.40, 17, 'No'),
(12, 11, 100, 14.40, 17, 'No'),
(13, 12, 10, 60.00, 20, 'No'),
(14, 13, 10, 72.00, 14, 'No'),
(15, 14, 5, 60.00, 4, 'No'),
(16, 15, 5, 102.00, 1, 'No'),
(17, 16, 100, 66.00, 8, 'No'),
(18, 17, 5, 36.00, 15, 'No'),
(19, 18, 10, 78.00, 2, 'No');

-- --------------------------------------------------------

--
-- Table structure for table `stock_return`
--

CREATE TABLE `stock_return` (
  `Stock_Return_ID` int(11) NOT NULL,
  `User_ID` int(11) NOT NULL,
  `Return_Date` date NOT NULL,
  `Status_ID` int(11) NOT NULL,
  `Reason` varchar(255) DEFAULT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_return`
--

INSERT INTO `stock_return` (`Stock_Return_ID`, `User_ID`, `Return_Date`, `Status_ID`, `Reason`, `IsArchived`) VALUES
(1, 4, '2026-08-22', 2, 'Sobra nga stock nga gi-release, gi-balik sa warehouse', 'No'),
(2, 3, '2026-09-05', 4, 'Near-expiry items gikan sa store', 'No'),
(3, 4, '2026-09-22', 1, 'expired', 'No'),
(4, 4, '2026-10-11', 2, 'damage', 'No');

-- --------------------------------------------------------

--
-- Table structure for table `stock_return_line`
--

CREATE TABLE `stock_return_line` (
  `Stock_Return_Line_ID` int(11) NOT NULL,
  `Stock_Return_ID` int(11) NOT NULL,
  `Product_ID` int(11) NOT NULL,
  `Quantity` int(11) NOT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_return_line`
--

INSERT INTO `stock_return_line` (`Stock_Return_Line_ID`, `Stock_Return_ID`, `Product_ID`, `Quantity`, `IsArchived`) VALUES
(1, 1, 8, 20, 'No'),
(2, 2, 4, 5, 'No'),
(7, 3, 4, 2, 'No'),
(8, 4, 20, 5, 'No');

-- --------------------------------------------------------

--
-- Table structure for table `supplier`
--

CREATE TABLE `supplier` (
  `SupplierID` int(11) NOT NULL,
  `SupplierName` varchar(150) NOT NULL,
  `ContactPerson` varchar(150) DEFAULT NULL,
  `Phone` varchar(50) DEFAULT NULL,
  `Email` varchar(150) DEFAULT NULL,
  `Address` varchar(255) DEFAULT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `supplier`
--

INSERT INTO `supplier` (`SupplierID`, `SupplierName`, `ContactPerson`, `Phone`, `Email`, `Address`, `IsArchived`) VALUES
(1, 'Golden Harvest Trading', 'Ramon Dela Cruz', '09171234567', 'ramon@goldenharvest.com', 'Cebu City, Cebu', 'No'),
(2, 'MegaFoods Distribution Inc.', 'Liza Fernandez', '09182345678', 'liza@megafoods.com', 'Mandaue City, Cebu', 'No'),
(3, 'CleanHome Supplies Corp', 'Jenny Alcantara', '09193456789', 'jenny@cleanhome.com', 'Talisay City, Cebu', 'No'),
(4, 'Fresh Dairy Co.', 'Mark Villareal', '09204567890', 'mark@freshdairy.com', 'Lapu-Lapu City, Cebu', 'No'),
(5, 'National Grains Supply', 'Anna Bautista', '09215678901', 'anna@nationalgrains.com', 'Consolacion, Cebu', 'No'),
(6, 'owen inc.', 'owen sayson', '09345678290', 'owen@gmail.com', '#184 balulang, cdo', 'No'),
(7, 'jen inc.', 'JENNIE LOU REDONDO', '09785647890', 'jen@gmail.com', 'CDO', 'No'),
(8, 'Waz', 'pitok', '09356306490', 'pitok@gmail.com', 'CDO', 'No'),
(9, 'Virginia Inc.', 'Juan Tamad', '09367894058', 'juan@gmail.com', 'Carinugan, Balulang, CDO', 'No'),
(10, 'Arbees Bakeshop', 'Mark Reyes', '09256738903', 'mark@gmail.com', 'Macanhan, CDO', 'No'),
(11, 'Fruits Corp.', 'Nikkola Ferrer', '09679190256', 'nikkola@gmail.com', 'BayaBas, CDO', 'No');

-- --------------------------------------------------------

--
-- Table structure for table `supplier_product`
--

CREATE TABLE `supplier_product` (
  `SupplierProductID` int(11) NOT NULL,
  `SupplierID` int(11) NOT NULL,
  `ProductID` int(11) NOT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `supplier_product`
--

INSERT INTO `supplier_product` (`SupplierProductID`, `SupplierID`, `ProductID`, `IsArchived`) VALUES
(1, 1, 1, 'No'),
(2, 1, 9, 'No'),
(3, 1, 10, 'No'),
(4, 2, 2, 'No'),
(5, 2, 8, 'No'),
(6, 2, 3, 'No'),
(7, 3, 5, 'No'),
(8, 3, 6, 'No'),
(9, 4, 4, 'No'),
(10, 5, 7, 'No'),
(11, 3, 3, 'No'),
(12, 3, 4, 'No'),
(13, 3, 13, 'No'),
(14, 4, 14, 'No'),
(15, 7, 11, 'No'),
(19, 7, 4, 'No'),
(22, 2, 15, 'No'),
(23, 7, 14, 'No'),
(24, 3, 11, 'No'),
(25, 3, 14, 'No'),
(26, 3, 15, 'No'),
(27, 8, 16, 'No'),
(28, 8, 17, 'No'),
(29, 11, 20, 'No');

-- --------------------------------------------------------

--
-- Table structure for table `unit_of_measure`
--

CREATE TABLE `unit_of_measure` (
  `UnitOfMeasureID` int(11) NOT NULL,
  `UnitName` varchar(50) NOT NULL,
  `UnitSymbol` varchar(10) DEFAULT NULL,
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `unit_of_measure`
--

INSERT INTO `unit_of_measure` (`UnitOfMeasureID`, `UnitName`, `UnitSymbol`, `IsArchived`) VALUES
(1, 'Piece', 'pc', 'No'),
(2, 'Kilogram', 'kg', 'No'),
(3, 'Liter', 'L', 'No'),
(4, 'Box', 'bx', 'No'),
(5, 'Pack', 'pk', 'No'),
(6, 'Sack', 'sk', 'No'),
(7, 'Cans', 'Cn', 'No');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `UserID` int(11) NOT NULL,
  `UserName` varchar(100) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `FirstName` varchar(100) DEFAULT NULL,
  `LastName` varchar(100) DEFAULT NULL,
  `Email` varchar(150) DEFAULT NULL,
  `RoleID` int(11) NOT NULL,
  `UserStatus` varchar(50) DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `IsArchived` enum('Yes','No') NOT NULL DEFAULT 'No'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`UserID`, `UserName`, `Password`, `FirstName`, `LastName`, `Email`, `RoleID`, `UserStatus`, `CreatedAt`, `IsArchived`) VALUES
(1, 'Admin', '$2y$10$mcMEeAoxp.n6VSzbrvAiBel82A4DvPC9.eXuhuyRiibhcIy6XrYk2', 'Pitok', 'Batolata', 'carlos.reyes@grocerywh.com', 1, 'Active', '2026-09-14 18:35:02', 'No'),
(2, 'jelian', '$2y$10$Whx38K2fORPb/E4qcggiveq2fpUH7BJvg7CiwfbYMS9hu9.tAIJ/2', 'jelian', 'saguing', 'sofia.mendoza@grocerywh.com', 5, 'Active', '2026-09-14 18:35:02', 'No'),
(3, 'Owen', '$2y$10$x7dGha01AVGDQqavVCTN..ApBYq3vraE0aBc0zbJdYZINg2Q0hIni', 'John', 'Sayson', 'juan.santos@grocerywh.com', 2, 'Active', '2026-09-14 18:35:02', 'No'),
(4, 'angel', '$2y$10$ONiGwB1hK9/W0ZRnukiKfurTZTgBgEIRGDzjr05UZdSClF4VMDaAC', 'jennie lou', 'redondo', 'maria.garcia@grocerywh.com', 3, 'Active', '2026-09-14 18:35:02', 'No'),
(5, 'lian', '$2y$10$9PyExcN3P3zPLEfjagdWE.mKkbSxdT1uH3eOyiSJrUd430Shgeqm6', 'lian', 'sultan', 'pedro.lim@grocerywh.com', 4, 'Active', '2026-09-14 18:35:02', 'No'),
(6, 'jenn', '$2y$10$q/qY9AS9807M3eqeLcfbJOXxycvh6Ui7gjncBQgcpZJ2DGpRm5KhW', 'jennie', 'redondo', 'red@gmail.com', 7, 'Active', '2026-09-17 18:58:01', 'No'),
(7, 'release', '$2y$10$ULoEOXWcXuVBQW8X.Tymgug6YHD0hiYA1MbJ29uGwvqvtqt4TaeUC', 'Querbie', 'Barsarsa', 'querbiebarsarsa@gmail.com', 8, 'Active', '2026-10-01 09:33:05', 'No');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `aisle`
--
ALTER TABLE `aisle`
  ADD PRIMARY KEY (`AisleID`);

--
-- Indexes for table `auditlog`
--
ALTER TABLE `auditlog`
  ADD PRIMARY KEY (`AuditLogID`),
  ADD KEY `fk_auditlog_user` (`UserID`);

--
-- Indexes for table `bin`
--
ALTER TABLE `bin`
  ADD PRIMARY KEY (`BinID`),
  ADD KEY `fk_bin_shelf` (`ShelfID`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`CategoryID`);

--
-- Indexes for table `inventory_adjustment`
--
ALTER TABLE `inventory_adjustment`
  ADD PRIMARY KEY (`Adjustment_ID`),
  ADD KEY `fk_ia_user` (`User_ID`),
  ADD KEY `fk_ia_status` (`Status_ID`);

--
-- Indexes for table `inventory_adjustment_line`
--
ALTER TABLE `inventory_adjustment_line`
  ADD PRIMARY KEY (`Adjustment_Line_ID`),
  ADD KEY `fk_ial_ia` (`Adjustment_ID`),
  ADD KEY `fk_ial_product` (`Product_ID`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`ProductID`),
  ADD KEY `fk_product_unitofmeasure` (`UnitOfMeasureID`),
  ADD KEY `fk_product_bin` (`BinID`),
  ADD KEY `fk_product_category` (`CategoryID`);

--
-- Indexes for table `purchase_order`
--
ALTER TABLE `purchase_order`
  ADD PRIMARY KEY (`PO_ID`),
  ADD KEY `fk_po_supplier` (`Supplier_ID`),
  ADD KEY `fk_po_user` (`User_ID`),
  ADD KEY `fk_po_status` (`Status_ID`);

--
-- Indexes for table `purchase_order_line`
--
ALTER TABLE `purchase_order_line`
  ADD PRIMARY KEY (`PO_Line_ID`),
  ADD KEY `fk_pol_po` (`PO_ID`),
  ADD KEY `fk_pol_product` (`Product_ID`);

--
-- Indexes for table `purchase_return`
--
ALTER TABLE `purchase_return`
  ADD PRIMARY KEY (`Purchase_Return_ID`),
  ADD KEY `fk_pr_po` (`PO_ID`),
  ADD KEY `fk_pr_supplier` (`Supplier_ID`),
  ADD KEY `fk_pr_user` (`User_ID`),
  ADD KEY `fk_pr_status` (`Status_ID`);

--
-- Indexes for table `purchase_return_line`
--
ALTER TABLE `purchase_return_line`
  ADD PRIMARY KEY (`Purchase_Return_Line_ID`),
  ADD KEY `fk_prl_pr` (`Purchase_Return_ID`),
  ADD KEY `fk_prl_product` (`Product_ID`);

--
-- Indexes for table `receiving`
--
ALTER TABLE `receiving`
  ADD PRIMARY KEY (`ReceivingID`),
  ADD KEY `fk_recv_supplier` (`SupplierID`),
  ADD KEY `fk_recv_user` (`ReceivedByUserID`),
  ADD KEY `fk_recv_status` (`StatusID`),
  ADD KEY `fk_receiving_po` (`PO_ID`);

--
-- Indexes for table `receiving_line`
--
ALTER TABLE `receiving_line`
  ADD PRIMARY KEY (`ReceivingLineID`),
  ADD KEY `fk_recvl_recv` (`ReceivingID`),
  ADD KEY `fk_recvl_product` (`ProductID`);

--
-- Indexes for table `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`RoleID`);

--
-- Indexes for table `shelf`
--
ALTER TABLE `shelf`
  ADD PRIMARY KEY (`ShelfID`),
  ADD KEY `fk_shelf_aisle` (`AisleID`);

--
-- Indexes for table `status`
--
ALTER TABLE `status`
  ADD PRIMARY KEY (`StatusID`);

--
-- Indexes for table `stock_release`
--
ALTER TABLE `stock_release`
  ADD PRIMARY KEY (`ReleaseID`),
  ADD KEY `fk_sr_reluser` (`ReleasedByUserID`),
  ADD KEY `fk_sr_status` (`Status_ID`);

--
-- Indexes for table `stock_release_line`
--
ALTER TABLE `stock_release_line`
  ADD PRIMARY KEY (`ReleaseLineID`),
  ADD KEY `fk_srl_release` (`ReleaseID`),
  ADD KEY `fk_srl_product` (`ProductID`);

--
-- Indexes for table `stock_return`
--
ALTER TABLE `stock_return`
  ADD PRIMARY KEY (`Stock_Return_ID`),
  ADD KEY `fk_sret_user` (`User_ID`),
  ADD KEY `fk_sret_status` (`Status_ID`);

--
-- Indexes for table `stock_return_line`
--
ALTER TABLE `stock_return_line`
  ADD PRIMARY KEY (`Stock_Return_Line_ID`),
  ADD KEY `fk_sretl_sret` (`Stock_Return_ID`),
  ADD KEY `fk_sretl_product` (`Product_ID`);

--
-- Indexes for table `supplier`
--
ALTER TABLE `supplier`
  ADD PRIMARY KEY (`SupplierID`);

--
-- Indexes for table `supplier_product`
--
ALTER TABLE `supplier_product`
  ADD PRIMARY KEY (`SupplierProductID`),
  ADD UNIQUE KEY `uq_supplier_product` (`SupplierID`,`ProductID`),
  ADD KEY `fk_sp_product` (`ProductID`);

--
-- Indexes for table `unit_of_measure`
--
ALTER TABLE `unit_of_measure`
  ADD PRIMARY KEY (`UnitOfMeasureID`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`UserID`),
  ADD KEY `fk_user_role` (`RoleID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `aisle`
--
ALTER TABLE `aisle`
  MODIFY `AisleID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `auditlog`
--
ALTER TABLE `auditlog`
  MODIFY `AuditLogID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=866;

--
-- AUTO_INCREMENT for table `bin`
--
ALTER TABLE `bin`
  MODIFY `BinID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `CategoryID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `inventory_adjustment`
--
ALTER TABLE `inventory_adjustment`
  MODIFY `Adjustment_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `inventory_adjustment_line`
--
ALTER TABLE `inventory_adjustment_line`
  MODIFY `Adjustment_Line_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `ProductID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `purchase_order`
--
ALTER TABLE `purchase_order`
  MODIFY `PO_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `purchase_order_line`
--
ALTER TABLE `purchase_order_line`
  MODIFY `PO_Line_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `purchase_return`
--
ALTER TABLE `purchase_return`
  MODIFY `Purchase_Return_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `purchase_return_line`
--
ALTER TABLE `purchase_return_line`
  MODIFY `Purchase_Return_Line_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `receiving`
--
ALTER TABLE `receiving`
  MODIFY `ReceivingID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `receiving_line`
--
ALTER TABLE `receiving_line`
  MODIFY `ReceivingLineID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `role`
--
ALTER TABLE `role`
  MODIFY `RoleID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `shelf`
--
ALTER TABLE `shelf`
  MODIFY `ShelfID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `status`
--
ALTER TABLE `status`
  MODIFY `StatusID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `stock_release`
--
ALTER TABLE `stock_release`
  MODIFY `ReleaseID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `stock_release_line`
--
ALTER TABLE `stock_release_line`
  MODIFY `ReleaseLineID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `stock_return`
--
ALTER TABLE `stock_return`
  MODIFY `Stock_Return_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `stock_return_line`
--
ALTER TABLE `stock_return_line`
  MODIFY `Stock_Return_Line_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `supplier`
--
ALTER TABLE `supplier`
  MODIFY `SupplierID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `supplier_product`
--
ALTER TABLE `supplier_product`
  MODIFY `SupplierProductID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `unit_of_measure`
--
ALTER TABLE `unit_of_measure`
  MODIFY `UnitOfMeasureID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `auditlog`
--
ALTER TABLE `auditlog`
  ADD CONSTRAINT `fk_auditlog_user` FOREIGN KEY (`UserID`) REFERENCES `user` (`UserID`);

--
-- Constraints for table `bin`
--
ALTER TABLE `bin`
  ADD CONSTRAINT `fk_bin_shelf` FOREIGN KEY (`ShelfID`) REFERENCES `shelf` (`ShelfID`);

--
-- Constraints for table `inventory_adjustment`
--
ALTER TABLE `inventory_adjustment`
  ADD CONSTRAINT `fk_ia_status` FOREIGN KEY (`Status_ID`) REFERENCES `status` (`StatusID`),
  ADD CONSTRAINT `fk_ia_user` FOREIGN KEY (`User_ID`) REFERENCES `user` (`UserID`);

--
-- Constraints for table `inventory_adjustment_line`
--
ALTER TABLE `inventory_adjustment_line`
  ADD CONSTRAINT `fk_ial_ia` FOREIGN KEY (`Adjustment_ID`) REFERENCES `inventory_adjustment` (`Adjustment_ID`),
  ADD CONSTRAINT `fk_ial_product` FOREIGN KEY (`Product_ID`) REFERENCES `product` (`ProductID`);

--
-- Constraints for table `product`
--
ALTER TABLE `product`
  ADD CONSTRAINT `fk_product_bin` FOREIGN KEY (`BinID`) REFERENCES `bin` (`BinID`),
  ADD CONSTRAINT `fk_product_category` FOREIGN KEY (`CategoryID`) REFERENCES `category` (`CategoryID`),
  ADD CONSTRAINT `fk_product_unitofmeasure` FOREIGN KEY (`UnitOfMeasureID`) REFERENCES `unit_of_measure` (`UnitOfMeasureID`);

--
-- Constraints for table `purchase_order`
--
ALTER TABLE `purchase_order`
  ADD CONSTRAINT `fk_po_status` FOREIGN KEY (`Status_ID`) REFERENCES `status` (`StatusID`),
  ADD CONSTRAINT `fk_po_supplier` FOREIGN KEY (`Supplier_ID`) REFERENCES `supplier` (`SupplierID`),
  ADD CONSTRAINT `fk_po_user` FOREIGN KEY (`User_ID`) REFERENCES `user` (`UserID`);

--
-- Constraints for table `purchase_order_line`
--
ALTER TABLE `purchase_order_line`
  ADD CONSTRAINT `fk_pol_po` FOREIGN KEY (`PO_ID`) REFERENCES `purchase_order` (`PO_ID`),
  ADD CONSTRAINT `fk_pol_product` FOREIGN KEY (`Product_ID`) REFERENCES `product` (`ProductID`);

--
-- Constraints for table `purchase_return`
--
ALTER TABLE `purchase_return`
  ADD CONSTRAINT `fk_pr_po` FOREIGN KEY (`PO_ID`) REFERENCES `purchase_order` (`PO_ID`),
  ADD CONSTRAINT `fk_pr_status` FOREIGN KEY (`Status_ID`) REFERENCES `status` (`StatusID`),
  ADD CONSTRAINT `fk_pr_supplier` FOREIGN KEY (`Supplier_ID`) REFERENCES `supplier` (`SupplierID`),
  ADD CONSTRAINT `fk_pr_user` FOREIGN KEY (`User_ID`) REFERENCES `user` (`UserID`);

--
-- Constraints for table `purchase_return_line`
--
ALTER TABLE `purchase_return_line`
  ADD CONSTRAINT `fk_prl_pr` FOREIGN KEY (`Purchase_Return_ID`) REFERENCES `purchase_return` (`Purchase_Return_ID`),
  ADD CONSTRAINT `fk_prl_product` FOREIGN KEY (`Product_ID`) REFERENCES `product` (`ProductID`);

--
-- Constraints for table `receiving`
--
ALTER TABLE `receiving`
  ADD CONSTRAINT `fk_receiving_po` FOREIGN KEY (`PO_ID`) REFERENCES `purchase_order` (`PO_ID`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_recv_status` FOREIGN KEY (`StatusID`) REFERENCES `status` (`StatusID`),
  ADD CONSTRAINT `fk_recv_supplier` FOREIGN KEY (`SupplierID`) REFERENCES `supplier` (`SupplierID`),
  ADD CONSTRAINT `fk_recv_user` FOREIGN KEY (`ReceivedByUserID`) REFERENCES `user` (`UserID`);

--
-- Constraints for table `receiving_line`
--
ALTER TABLE `receiving_line`
  ADD CONSTRAINT `fk_recvl_product` FOREIGN KEY (`ProductID`) REFERENCES `product` (`ProductID`),
  ADD CONSTRAINT `fk_recvl_recv` FOREIGN KEY (`ReceivingID`) REFERENCES `receiving` (`ReceivingID`);

--
-- Constraints for table `shelf`
--
ALTER TABLE `shelf`
  ADD CONSTRAINT `fk_shelf_aisle` FOREIGN KEY (`AisleID`) REFERENCES `aisle` (`AisleID`);

--
-- Constraints for table `stock_release`
--
ALTER TABLE `stock_release`
  ADD CONSTRAINT `fk_sr_reluser` FOREIGN KEY (`ReleasedByUserID`) REFERENCES `user` (`UserID`),
  ADD CONSTRAINT `fk_sr_status` FOREIGN KEY (`Status_ID`) REFERENCES `status` (`StatusID`);

--
-- Constraints for table `stock_release_line`
--
ALTER TABLE `stock_release_line`
  ADD CONSTRAINT `fk_srl_product` FOREIGN KEY (`ProductID`) REFERENCES `product` (`ProductID`),
  ADD CONSTRAINT `fk_srl_release` FOREIGN KEY (`ReleaseID`) REFERENCES `stock_release` (`ReleaseID`);

--
-- Constraints for table `stock_return`
--
ALTER TABLE `stock_return`
  ADD CONSTRAINT `fk_sret_status` FOREIGN KEY (`Status_ID`) REFERENCES `status` (`StatusID`),
  ADD CONSTRAINT `fk_sret_user` FOREIGN KEY (`User_ID`) REFERENCES `user` (`UserID`);

--
-- Constraints for table `stock_return_line`
--
ALTER TABLE `stock_return_line`
  ADD CONSTRAINT `fk_sretl_product` FOREIGN KEY (`Product_ID`) REFERENCES `product` (`ProductID`),
  ADD CONSTRAINT `fk_sretl_sret` FOREIGN KEY (`Stock_Return_ID`) REFERENCES `stock_return` (`Stock_Return_ID`);

--
-- Constraints for table `supplier_product`
--
ALTER TABLE `supplier_product`
  ADD CONSTRAINT `fk_sp_product` FOREIGN KEY (`ProductID`) REFERENCES `product` (`ProductID`),
  ADD CONSTRAINT `fk_sp_supplier` FOREIGN KEY (`SupplierID`) REFERENCES `supplier` (`SupplierID`);

--
-- Constraints for table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `fk_user_role` FOREIGN KEY (`RoleID`) REFERENCES `role` (`RoleID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
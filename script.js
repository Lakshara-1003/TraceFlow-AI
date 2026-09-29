// ==========================================
// TRACEFLOW AI
// FLOW ID + TRANSACTION ID SYSTEM
// ==========================================


// ==========================================
// LOAD SAVED DATA
// ==========================================

let transactions =
    JSON.parse(
        localStorage.getItem("traceflowTransactions")
    ) || [];


// ==========================================
// CONVERT OLD DATA
// ==========================================
//
// Old format:
// traceId, sender, receiver, amount
//
// New format:
// transactionId, flowId, sender, receiver, amount
//

transactions = transactions.map(
    (transaction, index) => {

        // Already new format
        if (
            transaction.transactionId &&
            transaction.flowId
        ) {

            return transaction;
        }


        // Convert old saved transaction
        return {

            transactionId:
                "TX-" +
                String(index + 1).padStart(3, "0"),

            flowId:
                transaction.traceId ||
                "TF-001",

            sender:
                transaction.sender || "",

            receiver:
                transaction.receiver || "",

            amount:
                Number(transaction.amount) || 0,

            parentTransaction:
                index > 0
                    ? "TX-" +
                      String(index).padStart(3, "0")
                    : null,

            time:
                transaction.time ||
                new Date().toLocaleString()

        };

    }
);


// ==========================================
// FIND NEXT TRANSACTION NUMBER
// ==========================================

let transactionNumber =
    Number(
        localStorage.getItem(
            "traceflowTransactionNumber"
        )
    ) || (transactions.length + 1);


// ==========================================
// FIND NEXT FLOW NUMBER
// ==========================================

let flowNumber =
    Number(
        localStorage.getItem(
            "traceflowFlowNumber"
        )
    ) || 1;


// ==========================================
// CHECK EXISTING FLOW NUMBERS
// ==========================================

transactions.forEach(
    transaction => {

        if (!transaction.flowId) {
            return;
        }


        const match =
            transaction.flowId.match(
                /TF-(\d+)/
            );


        if (match) {

            const number =
                Number(match[1]);


            if (
                number >= flowNumber
            ) {

                flowNumber =
                    number + 1;

            }

        }

    }
);


// ==========================================
// SAVE DATA
// ==========================================

function saveData() {

    localStorage.setItem(
        "traceflowTransactions",
        JSON.stringify(transactions)
    );


    localStorage.setItem(
        "traceflowTransactionNumber",
        transactionNumber
    );


    localStorage.setItem(
        "traceflowFlowNumber",
        flowNumber
    );
}


// Save converted old data
saveData();


// ==========================================
// CREATE TRANSACTION
// ==========================================

function createTransaction() {

    const sender =
        document.getElementById(
            "sender"
        ).value.trim();


    const receiver =
        document.getElementById(
            "receiver"
        ).value.trim();


    const amount =
        Number(
            document.getElementById(
                "amount"
            ).value
        );


    // ======================================
    // VALIDATE INPUT
    // ======================================

    if (
        sender === "" ||
        receiver === "" ||
        amount <= 0 ||
        isNaN(amount)
    ) {

        alert(
            "Please enter Sender, Receiver and a valid Amount."
        );

        return;
    }


    // ======================================
    // FIND PREVIOUS MONEY FLOW
    // ======================================

    const previousTransaction =
        [...transactions]
            .reverse()
            .find(
                transaction =>
                    transaction.receiver
                        .toLowerCase()
                    ===
                    sender.toLowerCase()
            );


    // ======================================
    // FLOW ID
    // ======================================

    let flowId;


    if (previousTransaction) {

        // Continue existing money lineage
        flowId =
            previousTransaction.flowId;

    } else {

        // New independent money flow
        flowId =
            "TF-" +
            String(flowNumber)
                .padStart(3, "0");


        flowNumber++;

    }


    // ======================================
    // NEW TRANSACTION ID
    // ======================================

    const transactionId =
        "TX-" +
        String(transactionNumber)
            .padStart(3, "0");


    transactionNumber++;


    // ======================================
    // CREATE TRANSACTION
    // ======================================

    const transaction = {

        transactionId:
            transactionId,

        flowId:
            flowId,

        sender:
            sender,

        receiver:
            receiver,

        amount:
            amount,

        parentTransaction:
            previousTransaction
                ? previousTransaction.transactionId
                : null,

        time:
            new Date().toLocaleString()

    };


    // Add transaction
    transactions.push(
        transaction
    );


    // Save
    saveData();


    // Update website
    updateDashboard();

    updateNetwork();

    updateAnalysis();

    updateTransactionTable();


    // Show Flow ID
    document.getElementById(
        "traceId"
    ).textContent =
        flowId;


    // Clear input
    document.getElementById(
        "sender"
    ).value = "";


    document.getElementById(
        "receiver"
    ).value = "";


    document.getElementById(
        "amount"
    ).value = "";
}


// ==========================================
// DASHBOARD
// ==========================================

function updateDashboard() {

    // Total Transactions
    document.getElementById(
        "transactionCount"
    ).textContent =
        transactions.length;


    // Active Flow IDs
    const flowIds =
        new Set();


    transactions.forEach(
        transaction => {

            if (
                transaction.flowId
            ) {

                flowIds.add(
                    transaction.flowId
                );

            }

        }
    );


    document.getElementById(
        "traceCount"
    ).textContent =
        flowIds.size;


    // Accounts
    const accounts =
        new Set();


    transactions.forEach(
        transaction => {

            if (
                transaction.sender
            ) {

                accounts.add(
                    transaction.sender
                );

            }


            if (
                transaction.receiver
            ) {

                accounts.add(
                    transaction.receiver
                );

            }

        }
    );


    document.getElementById(
        "accountCount"
    ).textContent =
        accounts.size;


    // Circular Flows
    document.getElementById(
        "circularCount"
    ).textContent =
        findCircularFlows().length;
}


// ==========================================
// BUILD NETWORK
// ==========================================

function buildNetwork() {

    const network = {};


    transactions.forEach(
        transaction => {

            if (
                !transaction.sender ||
                !transaction.receiver
            ) {

                return;

            }


            if (
                !network[
                    transaction.sender
                ]
            ) {

                network[
                    transaction.sender
                ] = [];

            }


            network[
                transaction.sender
            ].push(
                transaction.receiver
            );

        }
    );


    return network;
}


// ==========================================
// FIND CIRCULAR FLOWS
// ==========================================

function findCircularFlows() {

    const network =
        buildNetwork();


    const cycles = [];


    // ======================================
    // NORMALIZE CYCLE
    // ======================================

    function normalizeCycle(
        cycle
    ) {

        const nodes =
            cycle.slice(0, -1);


        const rotations = [];


        for (
            let i = 0;
            i < nodes.length;
            i++
        ) {

            const rotated = [

                ...nodes.slice(i),

                ...nodes.slice(0, i)

            ];


            rotations.push(
                rotated.join(" → ")
            );

        }


        rotations.sort();


        return rotations[0];
    }


    // ======================================
    // SEARCH CYCLE
    // ======================================

    function search(
        start,
        current,
        path,
        visited
    ) {

        if (
            !network[current]
        ) {

            return;

        }


        for (
            const next
            of network[current]
        ) {


            // Circular flow found
            if (
                next.toLowerCase()
                ===
                start.toLowerCase()
            ) {

                const cycle = [

                    ...path,
                    next

                ];


                const normalized =
                    normalizeCycle(
                        cycle
                    );


                if (
                    !cycles.includes(
                        normalized
                    )
                ) {

                    cycles.push(
                        normalized
                    );

                }


                continue;
            }


            // Already visited
            if (
                visited.has(next)
            ) {

                continue;

            }


            const newVisited =
                new Set(
                    visited
                );


            newVisited.add(
                next
            );


            search(

                start,

                next,

                [
                    ...path,
                    next
                ],

                newVisited

            );

        }

    }


    // Start from every account
    const accounts =
        Object.keys(
            network
        );


    accounts.forEach(
        account => {

            search(

                account,

                account,

                [account],

                new Set(
                    [account]
                )

            );

        }
    );


    return cycles;
}


// ==========================================
// NETWORK VISUALIZATION
// ==========================================

function updateNetwork() {

    const networkContainer =
        document.querySelector(
            ".network"
        );


    if (
        !networkContainer
    ) {

        return;

    }


    // No transactions
    if (
        transactions.length === 0
    ) {

        networkContainer.innerHTML = `

            <p style="
                color:#777;
                text-align:center;
                width:100%;
            ">

                No transactions added yet.

            </p>

        `;

        return;

    }


    // Clear old display
    networkContainer.innerHTML =
        "";


    // Display separately
    networkContainer.style.display =
        "block";


    // ======================================
    // GROUP TRANSACTIONS BY FLOW ID
    // ======================================

    const flowGroups = {};


    transactions.forEach(
        transaction => {

            const flowId =
                transaction.flowId ||
                "UNKNOWN";


            if (
                !flowGroups[flowId]
            ) {

                flowGroups[flowId] = [];

            }


            flowGroups[
                flowId
            ].push(
                transaction
            );

        }
    );


    // ======================================
    // DISPLAY EACH FLOW
    // ======================================

    Object.keys(
        flowGroups
    ).forEach(
        flowId => {


            // --------------------------------
            // FLOW TITLE
            // --------------------------------

            const flowTitle =
                document.createElement(
                    "div"
                );


            flowTitle.style.color =
                "#d6a84f";


            flowTitle.style.fontSize =
                "13px";


            flowTitle.style.fontWeight =
                "bold";


            flowTitle.style.letterSpacing =
                "1px";


            flowTitle.style.margin =
                "15px 0 8px";


            flowTitle.textContent =
                "FLOW ID: " +
                flowId;


            networkContainer.appendChild(
                flowTitle
            );


            // --------------------------------
            // TRANSACTIONS
            // --------------------------------

            flowGroups[
                flowId
            ].forEach(
                transaction => {


                    const row =
                        document.createElement(
                            "div"
                        );


                    row.style.display =
                        "flex";


                    row.style.alignItems =
                        "center";


                    row.style.justifyContent =
                        "center";


                    row.style.gap =
                        "18px";


                    row.style.width =
                        "100%";


                    row.style.padding =
                        "16px";


                    row.style.marginBottom =
                        "8px";


                    row.style.background =
                        "#080808";


                    row.style.border =
                        "1px solid #292929";


                    row.style.borderRadius =
                        "8px";


                    row.style.boxSizing =
                        "border-box";


                    // Sender
                    const sender =
                        document.createElement(
                            "div"
                        );


                    sender.style.textAlign =
                        "center";


                    sender.innerHTML = `

                        <div class="circle">

                            ${escapeHTML(
                                (
                                    transaction.sender
                                    || "?"
                                )
                                .charAt(0)
                                .toUpperCase()
                            )}

                        </div>

                        <span>

                            ${escapeHTML(
                                transaction.sender
                                || "Unknown"
                            )}

                        </span>

                    `;


                    // Amount + Arrow
                    const arrow =
                        document.createElement(
                            "div"
                        );


                    arrow.className =
                        "arrow";


                    arrow.innerHTML = `

                        ₹${Number(
                            transaction.amount
                        ).toLocaleString(
                            "en-IN"
                        )}

                        →

                    `;


                    // Receiver
                    const receiver =
                        document.createElement(
                            "div"
                        );


                    receiver.style.textAlign =
                        "center";


                    receiver.innerHTML = `

                        <div class="circle">

                            ${escapeHTML(
                                (
                                    transaction.receiver
                                    || "?"
                                )
                                .charAt(0)
                                .toUpperCase()
                            )}

                        </div>

                        <span>

                            ${escapeHTML(
                                transaction.receiver
                                || "Unknown"
                            )}

                        </span>

                    `;


                    // Transaction ID
                    const txId =
                        document.createElement(
                            "div"
                        );


                    txId.style.color =
                        "#d6a84f";


                    txId.style.fontSize =
                        "11px";


                    txId.textContent =
                        transaction.transactionId
                        || "TX-UNKNOWN";


                    // Add row
                    row.appendChild(
                        sender
                    );


                    row.appendChild(
                        arrow
                    );


                    row.appendChild(
                        receiver
                    );


                    row.appendChild(
                        txId
                    );


                    networkContainer.appendChild(
                        row
                    );

                }
            );

        }
    );


    // ======================================
    // CIRCULAR FLOW ALERT
    // ======================================

    const circularFlows =
        findCircularFlows();


    if (
        circularFlows.length > 0
    ) {

        const alertBox =
            document.createElement(
                "div"
            );


        alertBox.style.width =
            "100%";


        alertBox.style.marginTop =
            "20px";


        alertBox.style.padding =
            "18px";


        alertBox.style.border =
            "1px solid #d6a84f";


        alertBox.style.color =
            "#d6a84f";


        alertBox.style.textAlign =
            "center";


        alertBox.style.borderRadius =
            "6px";


        alertBox.innerHTML = `

            <strong>

                ⚠ CIRCULAR FLOW DETECTED

            </strong>

            <br><br>

            ${circularFlows
                .map(
                    flow => `
                        <div>
                            ${escapeHTML(flow)}
                        </div>
                    `
                )
                .join("")}

        `;


        networkContainer.appendChild(
            alertBox
        );

    }
}


// ==========================================
// AI ANALYSIS
// ==========================================

function updateAnalysis() {

    const analysisGrid =
        document.querySelector(
            ".analysis-grid"
        );


    if (
        !analysisGrid
    ) {

        return;

    }


    const circularFlows =
        findCircularFlows();


    // Accounts
    const accounts =
        new Set();


    transactions.forEach(
        transaction => {

            if (
                transaction.sender
            ) {

                accounts.add(
                    transaction.sender
                );

            }


            if (
                transaction.receiver
            ) {

                accounts.add(
                    transaction.receiver
                );

            }

        }
    );


    // Original amount
    const originalAmount =
        transactions.length > 0
            ? Number(
                transactions[0].amount
            )
            : 0;


    analysisGrid.innerHTML = `

        <div>

            <span>
                Circular Flow
            </span>

            <strong
                class="${
                    circularFlows.length > 0
                        ? "detected"
                        : ""
                }"
            >

                ${
                    circularFlows.length > 0
                        ? "DETECTED"
                        : "NONE"
                }

            </strong>

        </div>


        <div>

            <span>
                Connected Accounts
            </span>

            <strong>

                ${accounts.size}

            </strong>

        </div>


        <div>

            <span>
                Original Amount
            </span>

            <strong>

                ₹${originalAmount
                    .toLocaleString(
                        "en-IN"
                    )}

            </strong>

        </div>


        <div>

            <span>
                Investigation Status
            </span>

            <strong>

                ${
                    circularFlows.length > 0
                        ? "REQUIRES REVIEW"
                        : "NORMAL"
                }

            </strong>

        </div>

    `;
}


// ==========================================
// TRANSACTION HISTORY
// ==========================================

function updateTransactionTable() {

    const table =
        document.getElementById(
            "transactionTable"
        );


    if (
        !table
    ) {

        return;

    }


    // Change table header
    const tableElement =
        table.closest("table");


    if (
        tableElement
    ) {

        const thead =
            tableElement.querySelector(
                "thead"
            );


        if (
            thead
        ) {

            thead.innerHTML = `

                <tr>

                    <th>
                        Transaction ID
                    </th>

                    <th>
                        Flow ID
                    </th>

                    <th>
                        From
                    </th>

                    <th>
                        To
                    </th>

                    <th>
                        Amount
                    </th>

                    <th>
                        Status
                    </th>

                </tr>

            `;

        }

    }


    // Clear old rows
    table.innerHTML =
        "";


    // Add transactions
    transactions.forEach(
        transaction => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>

                    ${escapeHTML(
                        transaction.transactionId
                        || "TX-UNKNOWN"
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        transaction.flowId
                        || "TF-UNKNOWN"
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        transaction.sender
                        || ""
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        transaction.receiver
                        || ""
                    )}

                </td>


                <td>

                    ₹${Number(
                        transaction.amount
                    ).toLocaleString(
                        "en-IN"
                    )}

                </td>


                <td>

                    TRACKED

                </td>

            `;


            table.appendChild(
                row
            );

        }
    );
}


// ==========================================
// HTML SECURITY
// ==========================================

function escapeHTML(
    value
) {

    return String(
        value
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


// ==========================================
// START WEBSITE
// ==========================================

updateDashboard();

updateNetwork();

updateAnalysis();

updateTransactionTable();
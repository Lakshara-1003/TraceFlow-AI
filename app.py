import streamlit as st
import pandas as pd
import networkx as nx
import plotly.graph_objects as go

# -----------------------------
# Page configuration
# -----------------------------
st.set_page_config(
    page_title="TraceFlow AI",
    page_icon="🔎",
    layout="wide"
)

# -----------------------------
# Title
# -----------------------------
st.title("🔎 TraceFlow AI")
st.subheader("AI-Powered Financial Transaction Analysis")

st.write(
    "TraceFlow AI analyzes transaction patterns and highlights "
    "potentially suspicious money-flow networks for further investigation."
)

st.info(
    "⚠️ This is a prototype for demonstration. "
    "A suspicious pattern does not by itself prove money laundering."
)

# -----------------------------
# Sample transaction data
# -----------------------------
data = {
    "From": ["A101", "A102", "A103", "A101", "A104", "A105", "A106"],
    "To":   ["A102", "A103", "A101", "A104", "A105", "A106", "A107"],
    "Amount": [50000, 48000, 47000, 15000, 14000, 13500, 12000]
}

df = pd.DataFrame(data)

# -----------------------------
# Sidebar
# -----------------------------
st.sidebar.header("⚙️ Controls")

threshold = st.sidebar.number_input(
    "Suspicious amount threshold",
    min_value=1000,
    max_value=1000000,
    value=45000,
    step=1000
)

# -----------------------------
# Dashboard metrics
# -----------------------------
total_transactions = len(df)
total_amount = df["Amount"].sum()
accounts = len(set(df["From"]).union(set(df["To"])))

# Circular transactions
G = nx.DiGraph()

for _, row in df.iterrows():
    G.add_edge(row["From"], row["To"], amount=row["Amount"])

cycles = list(nx.simple_cycles(G))

suspicious_transactions = df[df["Amount"] >= threshold]

col1, col2, col3, col4 = st.columns(4)

col1.metric("Total Transactions", total_transactions)
col2.metric("Total Amount", f"₹{total_amount:,.0f}")
col3.metric("Connected Accounts", accounts)
col4.metric("Potentially Suspicious", len(suspicious_transactions))

# -----------------------------
# Transaction table
# -----------------------------
st.header("📋 Transaction Data")

st.dataframe(
    df,
    use_container_width=True
)

# -----------------------------
# Suspicious transactions
# -----------------------------
st.header("🚨 Suspicious Pattern Analysis")

if len(suspicious_transactions) > 0:

    st.warning(
        f"{len(suspicious_transactions)} transaction(s) "
        "cross the selected threshold."
    )

    st.dataframe(
        suspicious_transactions,
        use_container_width=True
    )

else:

    st.success("No transactions crossed the selected threshold.")

# -----------------------------
# Circular flow detection
# -----------------------------
st.header("🔄 Circular Transaction Detection")

if cycles:

    st.warning("Potential circular transaction network detected.")

    for cycle in cycles:

        cycle_text = " → ".join(cycle + [cycle[0]])

        st.write("🔴", cycle_text)

else:

    st.success("No circular transaction pattern detected.")

# -----------------------------
# Network graph
# -----------------------------
st.header("🕸️ Transaction Network")

positions = nx.spring_layout(G, seed=42)

edge_x = []
edge_y = []

for source, target in G.edges():

    x0, y0 = positions[source]
    x1, y1 = positions[target]

    edge_x.extend([x0, x1, None])
    edge_y.extend([y0, y1, None])

edge_trace = go.Scatter(
    x=edge_x,
    y=edge_y,
    line=dict(width=1),
    hoverinfo="none",
    mode="lines"
)

node_x = []
node_y = []

for node in G.nodes():

    x, y = positions[node]

    node_x.append(x)
    node_y.append(y)

node_trace = go.Scatter(
    x=node_x,
    y=node_y,
    mode="markers+text",
    text=list(G.nodes()),
    textposition="top center",
    marker=dict(
        size=25
    ),
    hoverinfo="text"
)

fig = go.Figure(
    data=[edge_trace, node_trace],
    layout=go.Layout(
        title="Financial Transaction Flow Network",
        showlegend=False,
        hovermode="closest",
        margin=dict(l=20, r=20, t=50, b=20),
        xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        yaxis=dict(showgrid=False, zeroline=False, showticklabels=False)
    )
)

st.plotly_chart(
    fig,
    use_container_width=True
)

# -----------------------------
# Investigation summary
# -----------------------------
st.header("🕵️ Investigation Summary")

st.write(
    "TraceFlow AI identifies transaction relationships, "
    "high-value transfers and circular money-flow patterns. "
    "These findings can help investigators decide which "
    "transactions require further review."
)

st.success("✅ Transaction analysis completed.")
